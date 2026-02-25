// react-to-print用 印刷コンポーネント（6枚対応）
import { forwardRef } from 'react';
import './AssessmentPrint.css';

const Td = ({ children, bold, center, w, colSpan, rowSpan, style }) => (
  <td colSpan={colSpan} rowSpan={rowSpan} style={{ fontWeight: bold ? 'bold' : 'normal', textAlign: center ? 'center' : 'left', width: w || undefined, ...style }}>
    {children || ''}
  </td>
);
const Th = ({ children, w, colSpan, rowSpan }) => (
  <th colSpan={colSpan} rowSpan={rowSpan} style={{ width: w || undefined, background: '#f0f0f0' }}>
    {children}
  </th>
);
const SecTitle = ({ children }) => <div className="sec-title">{children}</div>;
const PageBreak = () => <div className="page-break" />;
const HeaderRow = ({ title, name }) => (
  <div className="header-row">
    <h2>{title}</h2>
    <div className="date-box">
      {name ? <span>{name}</span> : <span>記入日：西暦　　年　　月　　日</span>}
    </div>
  </div>
);

const val = (v) => v || '';

const AssessmentPrintView = forwardRef(({ data = {}, clientName = '' }, ref) => {
  const fs = data.faceSheet || {};
  const fsb = data.faceSheetBack || {};
  const a1 = data.assessment1 || {};
  const a2 = data.assessment2 || {};
  const mental = data.mentalAssessment || {};
  const beh = data.behaviors || {};

  const routes = fs.commuteRoutes || [];
  const emergency = fs.emergency || [];
  const hospitals = fs.hospitals || [];
  const welfareServices = fs.welfareServices || [];
  const adminOffices = fs.adminOffices || [];
  const family = fsb.family || [];
  const econ = fsb.economics || {};
  const disability = fsb.disability || {};
  const certs = disability.certificates || {};
  const crisis = fsb.crisis || {};
  const employment = a1.employment || {};
  const housing = a1.housing || {};
  const social = a1.social || {};
  const medication = mental.medication || {};

  const BEHAVIOR_LABELS = { panic: 'パニック', obsession: 'こだわり', compulsion: '強迫行為・強迫観念', hallucination: '幻覚・妄想', seizure: '発作', other: 'その他' };

  return (
    <div ref={ref} className="print-root">

      {/* ===== ページ1: フェイスシート表 ===== */}
      <HeaderRow title="フェイスシート" />
      <p className="note">※非常災害時・危機対応に活用されるシートです。出来るかぎり詳細な記載にご協力下さい。</p>
      <SecTitle>基本情報</SecTitle>
      <table><tbody>
        <tr><Th w="12%">ふりがな</Th><Td w="38%">{val(fs.nameKana)}</Td><Th w="12%">生年月日</Th><Td>{val(fs.birthDate)}</Td></tr>
        <tr><Th>氏名</Th><Td>{val(fs.name)}</Td><Th>性別・血液型</Th><Td>{val(fs.gender)} / {val(fs.bloodType)}</Td></tr>
        <tr><Th>住所</Th><Td colSpan={3}>〒{val(fs.postalCode)}　{val(fs.address)}</Td></tr>
        <tr><Th>電話番号</Th><Td>{val(fs.phone)}</Td><Th>携帯電話</Th><Td>{val(fs.mobilePhone)}</Td></tr>
        <tr><Th>メールアドレス</Th><Td colSpan={3}>{val(fs.email)}</Td></tr>
      </tbody></table>

      <SecTitle>通所経路</SecTitle>
      <table><thead><tr><Th w="18%">交通手段</Th><Th w="20%">路線・会社</Th><Th>乗車〜降車</Th><Th w="14%">片道運賃</Th><Th w="14%">割引運賃</Th></tr></thead>
        <tbody>
          {routes.length > 0 ? routes.map((r, i) => (
            <tr key={i}><Td center>{val(r.type)}</Td><Td>{val(r.company)}</Td><Td>{val(r.from)}〜{val(r.to)}</Td><Td center>{r.cost ? `${r.cost}円` : '-'}</Td><Td center>{r.costDiscounted ? `${r.costDiscounted}円` : '-'}</Td></tr>
          )) : <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>経路情報なし</td></tr>}
        </tbody>
      </table>

      <SecTitle>緊急連絡先</SecTitle>
      <table><tbody>
        {[0,1,2].map(i => (
          <tr key={i}><Td center bold w="3%">{i+1}</Td><Th w="8%">氏名</Th><Td w="30%">{val(emergency[i]?.name)}</Td><Th w="8%">続柄</Th><Td w="18%">{val(emergency[i]?.relation)}</Td><Th w="10%">電話番号</Th><Td>{val(emergency[i]?.phone)}</Td></tr>
        ))}
      </tbody></table>

      <SecTitle>かかりつけ医療機関</SecTitle>
      {[0,1].map(i => (
        <table key={i}><tbody>
          <tr><Td center bold rowSpan={2} w="3%">{i+1}</Td><Th w="10%">病院名</Th><Td colSpan={3}>{val(hospitals[i]?.name)}</Td><Th w="10%">電話番号</Th><Td w="20%">{val(hospitals[i]?.phone)}</Td></tr>
          <tr><Th>受診科目</Th><Td>{val(hospitals[i]?.dept)}</Td><Th w="8%">担当医</Th><Td>{val(hospitals[i]?.doctor)}</Td><Th>通院頻度</Th><Td>{val(hospitals[i]?.freq)}</Td></tr>
        </tbody></table>
      ))}

      <SecTitle>相談支援事業所・福祉サービス・行政窓口</SecTitle>
      <table><tbody>
        <tr><Th w="12%">相談支援事業所</Th><Td>{val(fs.supportOffice?.name)}</Td><Th w="8%">担当</Th><Td>{val(fs.supportOffice?.person)}</Td><Th w="8%">電話</Th><Td>{val(fs.supportOffice?.phone)}</Td></tr>
        {[0,1].map(i => (
          <tr key={i}><Th>福祉サービス{i+1}</Th><Td>{val(welfareServices[i]?.name)}</Td><Th>種別</Th><Td>{val(welfareServices[i]?.type)}</Td><Th>担当</Th><Td>{val(welfareServices[i]?.person)}</Td></tr>
        ))}
        {[0,1].map(i => (
          <tr key={i}><Th>行政窓口{i+1}</Th><Td>{val(adminOffices[i]?.city)}</Td><Th>課・係</Th><Td>{val(adminOffices[i]?.section)}</Td><Th>担当</Th><Td>{val(adminOffices[i]?.person)}</Td></tr>
        ))}
        <tr><Th>ハローワーク</Th><Td>{fs.helloWork?.status === 'registered' ? '登録済' : '未登録'}</Td><Th>担当</Th><Td>{val(fs.helloWork?.person)}</Td><Th>電話</Th><Td>{val(fs.helloWork?.phone)}</Td></tr>
      </tbody></table>

      {/* ===== ページ2: フェイスシート裏 ===== */}
      <PageBreak />
      <HeaderRow title="フェイスシート（裏）" name={clientName} />

      <SecTitle>家族構成</SecTitle>
      <table><thead><tr><Th w="4%">No</Th><Th>氏名</Th><Th w="12%">続柄</Th><Th w="12%">同居</Th><Th>備考</Th></tr></thead>
        <tbody>
          {family.filter(f => f.name).map((f, i) => (
            <tr key={i}><Td center>{i+1}</Td><Td>{val(f.name)}</Td><Td center>{val(f.relation)}</Td><Td center>{f.living === 'yes' ? '同居' : '別居'}</Td><Td>{val(f.note)}</Td></tr>
          ))}
          {family.filter(f => f.name).length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>-</td></tr>}
        </tbody>
      </table>

      <SecTitle>経済状況</SecTitle>
      <table><tbody>
        <tr><Th w="12%">生活保護</Th><Td>{val(econ.welfare?.status)} {econ.welfare?.amount ? `${econ.welfare.amount}円/月` : ''}</Td><Th w="12%">障害年金</Th><Td>{val(econ.disabilityPension?.status)} {val(econ.disabilityPension?.grade)} {econ.disabilityPension?.amount ? `${econ.disabilityPension.amount}円/月` : ''}</Td></tr>
        <tr><Th>健康保険</Th><Td>{val(econ.healthInsurance?.type)} {val(econ.healthInsurance?.holder)}</Td><Th>自立支援医療</Th><Td>{val(econ.selfSupportMedical)}</Td></tr>
        <tr><Th>備考</Th><Td colSpan={3} style={{ whiteSpace: 'pre-wrap' }}>{val(econ.note)}</Td></tr>
      </tbody></table>

      <SecTitle>障害・疾病の状況</SecTitle>
      <table><tbody>
        <tr><Th w="12%">障害種別</Th><Td>{(disability.types || []).join('、') || '-'}</Td><Th w="12%">診断名</Th><Td>{val(disability.diagnosisName)}</Td></tr>
        <tr><Th>合併障害</Th><Td>{val(disability.comorbidity)}</Td><Th>手帳申請状況</Th><Td>{val(disability.certStatus)}</Td></tr>
        {[{k:'mental',l:'精神障害者保健福祉手帳'},{k:'intellectual',l:'療育手帳'},{k:'physical',l:'身体障害者手帳'}].map(({k,l}) => (
          <tr key={k}><Th>{l}</Th><Td>{certs[k]?.grade ? `${certs[k].grade}級` : '-'}</Td><Th>取得日</Th><Td>{val(certs[k]?.date)}</Td></tr>
        ))}
      </tbody></table>

      <SecTitle>緊急災害時・危機対応</SecTitle>
      <table><thead><tr><Th w="30%">質問</Th><Th w="35%">ご回答</Th><Th>対処法</Th></tr></thead>
        <tbody>
          <tr><td>非常災害時、身体面で心配なこと</td><Td>{val(crisis.physical?.answer)} {val(crisis.physical?.detail)}</Td><Td>{val(crisis.physical?.coping)}</Td></tr>
          <tr><td>発作はありますか</td><Td>{val(crisis.seizure?.answer)} {val(crisis.seizure?.detail)}</Td><Td>{val(crisis.seizure?.coping)}</Td></tr>
          <tr><td>自傷・他害の心配</td><Td>過去:{val(crisis.selfHarm?.past)} 現在:{val(crisis.selfHarm?.present)}<br />{val(crisis.selfHarm?.detail)}</Td><Td>{val(crisis.selfHarm?.coping)}</Td></tr>
          <tr><td>自殺念慮の有無</td><Td>過去:{val(crisis.suicidal?.past)} 現在:{val(crisis.suicidal?.present)}<br />{val(crisis.suicidal?.detail)}</Td><Td>{val(crisis.suicidal?.coping)}</Td></tr>
        </tbody>
      </table>
      <div style={{ border: '1px solid #000', minHeight: 40, padding: '4px 6px', whiteSpace: 'pre-wrap' }}>特記事項：{val(crisis.generalNote)}</div>

      {/* ===== ページ3-4: アセスメントシート1 ===== */}
      <PageBreak />
      <HeaderRow title="アセスメントシート１（社会参加・生活・就労）" />

      <SecTitle>社会参加（地域生活関連）</SecTitle>
      <table><tbody>
        <tr><Th w="20%">外出の頻度</Th><Td>{val(social.outingFreq)}</Td><Th w="20%">主な外出先</Th><Td>{val(social.outingPlaces)}</Td></tr>
        <tr><Th>社会参加の状況</Th><Td colSpan={3}>{val(social.participation)}</Td></tr>
        <tr><Th>過去2年間の入所歴</Th><Td colSpan={3}>{social.admissionHistory === 'yes' ? `あり　①${val(social.admissionPeriod1)}（${val(social.admissionType1)}）　②${val(social.admissionPeriod2)}（${val(social.admissionType2)}）` : 'なし'}</Td></tr>
        <tr><Th>その他</Th><Td colSpan={3}>{val(social.note)}</Td></tr>
      </tbody></table>

      <SecTitle>日中活動</SecTitle>
      <table><tbody>
        <tr><Th w="20%">主な活動場所</Th><Td>{val(a1.dailyActivity?.place)}</Td></tr>
        <tr><Th>1日の様子</Th><Td style={{ whiteSpace: 'pre-wrap', minHeight: 80 }}>{val(a1.dailyActivity?.dayDescription)}</Td></tr>
        <tr><Th>休日の様子</Th><Td style={{ whiteSpace: 'pre-wrap' }}>{val(a1.dailyActivity?.holidayDescription)}</Td></tr>
      </tbody></table>

      <SecTitle>居住関連</SecTitle>
      <table><tbody>
        <tr><Th w="20%">住居形態</Th><Td>{val(housing.type)}</Td><Th w="20%">建物種別</Th><Td>{val(housing.structure)}</Td></tr>
        <tr><Th>本人の部屋</Th><Td>{val(housing.room)}</Td><Th>寝具</Th><Td>{val(housing.bedding)}</Td></tr>
        <tr><Th>特記事項</Th><Td colSpan={3}>{val(housing.notes)}</Td></tr>
      </tbody></table>

      <SecTitle>免許・資格・検定など</SecTitle>
      <table><tbody>
        <tr><Th w="12%">有無</Th><Td w="20%">{val(a1.qualificationsStatus)}</Td><Th w="12%">内容</Th><Td>{val(a1.qualifications)}</Td></tr>
      </tbody></table>

      <SecTitle>就労関連について</SecTitle>
      <table><tbody>
        <tr><Th w="20%">就労状況</Th><Td colSpan={3}>{(employment.currentStatus || []).join('、') || '-'}</Td></tr>
        <tr><Th>一般就労・アルバイト経験</Th><Td>{val(employment.expGeneral)}</Td><Th>移行・継続支援経験</Th><Td>{val(employment.expWelfare)}</Td></tr>
        <tr><Th>最近1年間の就労経験</Th><Td>{val(employment.expRecent)}</Td><Th>中断の有無</Th><Td>{val(employment.interrupted)}</Td></tr>
        <tr><Th>主な就労先（最後）</Th><Td colSpan={3}>{val(employment.mainEmployer)}</Td></tr>
        <tr><Th>一般就労希望</Th><Td>{val(employment.hopeGeneral)}</Td><Th>希望する仕事</Th><Td>{val(employment.desiredJob)}</Td></tr>
        <tr><Th>就職希望時期</Th><Td>{val(employment.desiredTiming)}</Td><Th>オープン/クローズ</Th><Td>{val(employment.openClose)}</Td></tr>
        <tr><Th>特記事項</Th><Td colSpan={3} style={{ whiteSpace: 'pre-wrap' }}>{val(employment.notes)}</Td></tr>
      </tbody></table>

      {/* ===== ページ5: アセスメントシート2 ===== */}
      <PageBreak />
      <HeaderRow title="アセスメントシート２（本人の意向・好み）" />
      <table><tbody>
        {[
          { label: '好きなこと・得意なこと',           key: 'likes' },
          { label: '嫌いなこと・苦手なこと',           key: 'dislikes' },
          { label: '希望する暮らし',                   key: 'desiredLifestyle' },
          { label: '特に支援してほしいこと',           key: 'supportRequests' },
          { label: '支援をするとき気をつけてほしいこと',key: 'supportPrecautions' },
          { label: '将来の夢や希望',                   key: 'futureDreams' },
          { label: 'その他',                           key: 'other' },
        ].map(({ label, key }) => (
          <tr key={key}><Th w="22%">{label}</Th><Td style={{ minHeight: 60, whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{val(a2[key])}</Td></tr>
        ))}
      </tbody></table>

      {/* ===== ページ6: アセスメントシート（精神） ===== */}
      <PageBreak />
      <HeaderRow title="アセスメントシート（精神）" name={clientName} />
      <table><tbody>
        <tr><Th w="20%">障害の状況</Th><Td style={{ whiteSpace: 'pre-wrap' }}>{val(mental.disabilityStatus?.description)}</Td><Th w="20%">支援者追記</Th><Td style={{ whiteSpace: 'pre-wrap' }}>{val(mental.disabilityStatus?.staffNote)}</Td></tr>
        <tr><Th>診断確定時期・きっかけ</Th><Td>{val(mental.treatmentStatus?.diagnosisDate)} / {val(mental.treatmentStatus?.trigger)}</Td><Th>支援者追記</Th><Td>{val(mental.treatmentStatus?.staffNote)}</Td></tr>
        <tr><Th>初診時期・通院頻度</Th><Td>{val(mental.hospitalStatus?.firstVisit)} / {val(mental.hospitalStatus?.freq)}</Td><Th>入院歴</Th><Td>{val(mental.hospitalStatus?.admission)}</Td></tr>
        <tr><Th>現在の病状</Th><Td>{val(mental.condition?.status)} {val(mental.condition?.detail)}</Td><Th>支援者追記</Th><Td>{val(mental.condition?.staffNote)}</Td></tr>
        <tr><Th>体調不良のサイン</Th><Td>{(mental.badSignals?.signs || []).join('、')}</Td><Th>起こりやすい時</Th><Td>{(mental.badSignals?.triggers || []).join('、')}</Td></tr>
        <tr><Th>体調不良時の対処</Th><Td>{(mental.copingMethods?.methods || []).join('、')} {val(mental.copingMethods?.other)}</Td><Th>支援者追記</Th><Td>{val(mental.copingMethods?.staffNote)}</Td></tr>
        <tr><Th>相談相手</Th><Td>{val(mental.consultation?.partner)} {val(mental.consultation?.name)}</Td><Th>支援者追記</Th><Td>{val(mental.consultation?.staffNote)}</Td></tr>
        <tr><Th>服薬</Th><Td colSpan={3}>{val(medication.status)} {medication.times ? `1日${medication.times}回` : ''} {(medication.timing || []).join('・')} / 管理:{val(medication.management)} / 状況:{val(medication.adherence)}</Td></tr>
      </tbody></table>

      {/* ===== ページ7: 行動について ===== */}
      <PageBreak />
      <HeaderRow title="アセスメントシート（行動面）" name={clientName} />
      <table>
        <thead><tr><Th w="14%">項目</Th><Th w="12%">状態</Th><Th w="25%">本人コメント</Th><Th>支援者追記</Th></tr></thead>
        <tbody>
          {Object.entries(BEHAVIOR_LABELS).map(([key, label]) => {
            const item = beh[key] || {};
            return (
              <tr key={key}>
                <Td bold center>{label}</Td>
                <Td center>{val(item.status)}<br />{(item.coping || []).join('、')}</Td>
                <Td style={{ whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{val(item.selfComment)}</Td>
                <Td style={{ whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{val(item.staffNote)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 8, border: '1px solid #000', minHeight: 60, padding: '4px 6px', whiteSpace: 'pre-wrap' }}>
        <strong>特記事項：</strong>{val(beh.behaviorNotes)}
      </div>

    </div>
  );
});

AssessmentPrintView.displayName = 'AssessmentPrintView';
export default AssessmentPrintView;
