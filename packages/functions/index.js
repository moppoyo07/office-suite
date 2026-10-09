// firebase-functions v6 以降、ルート import は 2nd gen になる。
// 2nd gen に移すと lineWebhook の URL が変わり LINE 側の設定が壊れるため、1st gen のまま据え置く。
const functions = require("firebase-functions/v1");
// firebase-admin v13 以降、admin.firestore() 等の名前空間 API は廃止された。
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

/**
 * LINE Webhook エンドポイント（第1世代）
 * 環境変数は .env ファイルから自動で読み込まれる
 * URL は LINE Developers コンソールに登録済み。関数名・リージョン・世代を変えると URL が変わる
 */
exports.lineWebhook = functions.https.onRequest(async (req, res) => {
  const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  // POST以外は拒否
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const events = req.body.events || [];

  // LINE の検証リクエスト（eventsが空）はそのまま200を返す
  if (events.length === 0) {
    return res.status(200).send("OK");
  }

  // 署名検証（なりすまし防止）
  const body = req.rawBody;
  const signature = crypto
    .createHmac("SHA256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  if (signature !== req.headers["x-line-signature"]) {
    console.error("署名検証失敗");
    return res.status(401).send("Unauthorized");
  }

  for (const event of events) {
    try {
      await handleEvent(event, LINE_CHANNEL_ACCESS_TOKEN);
    } catch (e) {
      console.error("イベント処理エラー:", e);
    }
  }

  res.status(200).send("OK");
});

/**
 * LINEイベントを処理する
 */
async function handleEvent(event, accessToken) {
  if (event.type !== "message") return;

  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  const messageText =
    event.message.type === "text" ? event.message.text : `[${event.message.type}]`;

  const clientQuery = await db
    .collection("clients")
    .where("lineUserId", "==", lineUserId)
    .limit(1)
    .get();

  if (!clientQuery.empty) {
    const clientDoc = clientQuery.docs[0];
    const clientData = clientDoc.data();

    await db
      .collection("clients")
      .doc(clientDoc.id)
      .collection("activity_logs")
      .add({
        type: "line_message",
        content: messageText,
        clientName: clientData.name || "",
        staffUid: "line_bot",
        staffName: "LINE自動記録",
        companyId: clientData.companyId || null,
        createdAt: FieldValue.serverTimestamp(),
        source: "line",
        lineUserId: lineUserId,
      });

    console.log(`活動記録に保存: clientId=${clientDoc.id}`);
  } else {
    let displayName = "不明";
    try {
      displayName = await getLineDisplayName(lineUserId, accessToken);
    } catch (e) {
      console.error("プロフィール取得失敗:", e);
    }

    await db.collection("unlinkedLineMessages").add({
      lineUserId,
      displayName,
      messageType: event.message.type,
      message: messageText,
      receivedAt: FieldValue.serverTimestamp(),
      linked: false,
    });

    console.log(`未紐付きメッセージ保存: lineUserId=${lineUserId}`);
  }
}

/**
 * ダッシュボードからLINEメッセージを送信する（Callable Function）
 * data: { clientId, message }
 */
exports.sendLineMessage = functions.https.onCall(async (data, context) => {
  const auth = context.auth;
  if (!auth) throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");

  const { clientId, message } = data;
  if (!clientId || !message) {
    throw new functions.https.HttpsError("invalid-argument", "clientId と message は必須です");
  }

  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    throw new functions.https.HttpsError("internal", "LINE ACCESS TOKEN が未設定です");
  }

  // クライアント情報を取得
  const clientDoc = await db.collection("clients").doc(clientId).get();
  if (!clientDoc.exists) {
    throw new functions.https.HttpsError("not-found", "クライアントが見つかりません");
  }
  const clientData = clientDoc.data();

  // 送信者が、その利用者を抱える企業に属しているかを検証する
  // 画面から作成したユーザーは doc ID が自動採番で uid と一致しないため、uid フィールド → email の順で探す
  let userDoc = await db.collection("users").doc(auth.uid).get();
  if (!userDoc.exists) {
    const byUid = await db.collection("users").where("uid", "==", auth.uid).limit(1).get();
    if (!byUid.empty) {
      userDoc = byUid.docs[0];
    } else if (auth.token.email) {
      const byEmail = await db.collection("users").where("email", "==", auth.token.email).limit(1).get();
      if (!byEmail.empty) userDoc = byEmail.docs[0];
    }
  }
  const userData = userDoc.exists ? userDoc.data() : {};
  const isPlatform = ["platform_owner", "platform_staff"].includes(userData.role);
  const allowedCompanyIds = [
    userData.companyId,
    ...(userData.assignedCompanies || []),
  ].filter(Boolean);

  if (!isPlatform && !allowedCompanyIds.includes(clientData.companyId)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "この利用者へ送信する権限がありません"
    );
  }

  const lineUserId = clientData.lineUserId;
  if (!lineUserId) {
    throw new functions.https.HttpsError("failed-precondition", "このクライアントはLINE未連携です");
  }

  // LINE Push Message API で送信
  const resp = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!resp.ok) {
    const errorBody = await resp.text();
    console.error("LINE送信エラー:", errorBody);
    throw new functions.https.HttpsError("internal", "LINE送信に失敗しました: " + errorBody);
  }

  // 送信ログを activity_logs に記録
  await db.collection("clients").doc(clientId).collection("activity_logs").add({
    type: "line_reply",
    content: message,
    clientName: clientData.name || "",
    staffUid: auth.uid,
    staffName: userData.displayName || auth.token?.name || "スタッフ",
    companyId: clientData.companyId || null,
    createdAt: FieldValue.serverTimestamp(),
    source: "line",
    lineUserId: lineUserId,
  });

  console.log(`LINE送信成功: clientId=${clientId}, to=${lineUserId}`);
  return { success: true };
});

async function getLineDisplayName(lineUserId, accessToken) {
  const resp = await fetch(
    `https://api.line.me/v2/bot/profile/${lineUserId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) throw new Error(`LINE API error: ${resp.status}`);
  const data = await resp.json();
  return data.displayName;
}

