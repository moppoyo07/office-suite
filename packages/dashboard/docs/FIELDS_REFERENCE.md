# データフィールド一覧

Firestore に保存される各コレクションのフィールド定義一覧です。

---

## users コレクション（ユーザー情報）

### 基本情報
| フィールド名 | 型 | 説明 | 必須 |
|-------------|------|------|:----:|
| `email` | string | メールアドレス | ✅ |
| `displayName` | string | 表示名 | ✅ |
| `kanaName` | string | ふりがな | |

### 所属・権限
| フィールド名 | 型 | 説明 | 必須 |
|-------------|------|------|:----:|
| `role` | string | ロール（platform_owner/company_admin等） | ✅ |
| `companyId` | string | 所属企業ID | |
| `branchId` | string | 所属支店ID | |

### 個人情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `birthDate` | string | 生年月日（YYYY-MM-DD） |
| `gender` | string | 性別（male/female/other） |
| `bloodType` | string | 血液型（A/B/O/AB/unknown） |
| `myNumber` | string | マイナンバー（12桁）⚠️機密 |

### 連絡先
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `phone` | string | 電話番号 |
| `postalCode` | string | 郵便番号（XXX-XXXX） |
| `prefecture` | string | 都道府県 |
| `city` | string | 市区町村 |
| `address1` | string | 町名・番地 |
| `address2` | string | 建物名・部屋番号 |

### 緊急連絡先
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `emergencyContactName` | string | 緊急連絡先 氏名 |
| `emergencyContactPhone` | string | 緊急連絡先 電話番号 |
| `emergencyContactRelation` | string | 続柄（spouse/parent/sibling等） |

### 雇用情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `employeeNumber` | string | 社員番号 |
| `hireDate` | string | 入社日（YYYY-MM-DD） |
| `employmentType` | string | 雇用形態（full_time/part_time/contract等） |
| `department` | string | 部署・配属先 |
| `contractEndDate` | string | 契約終了日（有期の場合） |
| `probationEndDate` | string | 試用期間終了日 |

### 給与情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `salaryType` | string | 給与形態（monthly/hourly/daily） |
| `baseSalary` | number | 基本給（円） |
| `weeklyWorkHours` | number | 週の所定労働時間 |

### 銀行口座
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `bankName` | string | 銀行名 |
| `bankBranchName` | string | 支店名 |
| `bankAccountType` | string | 口座種別（ordinary/current/savings） |
| `bankAccountNumber` | string | 口座番号 ⚠️機密 |
| `bankAccountHolder` | string | 口座名義 |

### 保険情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `healthInsuranceNumber` | string | 健康保険被保険者番号 ⚠️機密 |
| `pensionNumber` | string | 基礎年金番号 ⚠️機密 |
| `employmentInsuranceNumber` | string | 雇用保険被保険者番号 ⚠️機密 |

### 資格・免許
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `hasDriverLicense` | boolean | 運転免許の有無 |
| `driverLicenseType` | string | 免許種類（ordinary/medium/large等） |
| `qualifications` | string | 保有資格（カンマ区切り） |

### 健康情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `allergies` | string | アレルギー情報 |
| `medicalConditions` | string | 持病・服薬情報 |
| `healthNotes` | string | 健康上の注意事項 |

### 退職情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `isActive` | boolean | 在籍中フラグ（デフォルト: true） |
| `resignationDate` | string | 退職日 |
| `resignationReason` | string | 退職理由 |

### システムフィールド
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `invitePending` | boolean | 招待中フラグ |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

---

## companies コレクション（企業情報）

### 基本情報
| フィールド名 | 型 | 説明 | 必須 |
|-------------|------|------|:----:|
| `name` | string | 会社名 | ✅ |
| `nameKana` | string | 会社名（カナ） | |
| `representativeName` | string | 代表者名 | |
| `establishedDate` | string | 設立日 | |
| `employeeCount` | number | 従業員数 | |
| `fiscalMonth` | string | 決算月（1-12） | |

### 法人情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `corporateNumber` | string | 法人番号（13桁） |
| `corporateType` | string | 法人格（kabushiki/godo/npo等） |
| `capitalAmount` | number | 資本金（円） |

### 連絡先
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `phone` | string | 電話番号 |
| `fax` | string | FAX番号 |
| `email` | string | メールアドレス |
| `postalCode` | string | 郵便番号 |
| `prefecture` | string | 都道府県 |
| `city` | string | 市区町村 |
| `address1` | string | 町名・番地 |
| `address2` | string | 建物名 |

### 労務関連番号
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `employmentInsuranceNumber` | string | 雇用保険事業所番号 ⚠️機密 |
| `laborInsuranceNumber` | string | 労働保険番号 ⚠️機密 |
| `pensionOfficeNumber` | string | 厚生年金適用事業所番号 ⚠️機密 |
| `pensionOfficeName` | string | 管轄年金事務所 |
| `healthInsuranceNumber` | string | 健康保険適用事業所番号 ⚠️機密 |

### ハローワーク
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `helloworkNumber` | string | ハローワーク事業所番号 |
| `helloworkName` | string | 管轄ハローワーク名 |

### 福祉事業
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `welfareServiceNumber` | string | 事業所指定番号 |
| `welfareServiceType` | string | サービス種別（b_type/a_type等） |
| `designationDate` | string | 指定年月日 |
| `renewalDate` | string | 更新年月日 |
| `municipalityDept` | string | 自治体担当課 |
| `municipalityContact` | string | 担当者連絡先 |

### 銀行口座
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `bankName` | string | 銀行名 |
| `bankBranchName` | string | 支店名 |
| `bankAccountType` | string | 口座種別（ordinary/current） |
| `bankAccountNumber` | string | 口座番号 ⚠️機密 |
| `bankAccountHolder` | string | 口座名義 |

### 顧問・外部連携
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `taxAdvisorName` | string | 顧問税理士 |
| `taxAdvisorContact` | string | 税理士連絡先 |
| `laborAdvisorName` | string | 顧問社労士 |
| `laborAdvisorContact` | string | 社労士連絡先 |

### システムフィールド
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `userCount` | number | 所属ユーザー数 |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

---

## branches コレクション（支店・事業所情報）

### 基本情報
| フィールド名 | 型 | 説明 | 必須 |
|-------------|------|------|:----:|
| `name` | string | 支店名（事業所名） | ✅ |
| `nameKana` | string | 支店名（カナ） | |
| `branchCode` | string | 事業所コード | |
| `companyId` | string | 所属企業ID | ✅ |
| `openDate` | string | 開設日 | |
| `managerName` | string | 管理者名 | |

### 連絡先
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `phone` | string | 電話番号 |
| `fax` | string | FAX番号 |
| `email` | string | メールアドレス |
| `postalCode` | string | 郵便番号 |
| `prefecture` | string | 都道府県 |
| `city` | string | 市区町村 |
| `address1` | string | 町名・番地 |
| `address2` | string | 建物名 |

### 福祉事業情報
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `welfareServiceNumber` | string | 事業所指定番号（10桁） |
| `welfareServiceType` | string | サービス種別 |
| `designationDate` | string | 指定年月日 |
| `renewalDate` | string | 更新年月日 |
| `municipalityName` | string | 保険者（自治体） |

### 定員・設備
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `capacity` | number | 利用者の定員 |
| `currentUserCount` | number | 現在利用者数 |
| `floorSpace` | number | 床面積（㎡） |
| `hasParking` | string | 駐車場（yes/no） |
| `parkingSpaces` | number | 駐車台数 |
| `hasAccessibility` | string | バリアフリー対応（full/partial/none） |
| `notes` | string | 備考 |

### システムフィールド
| フィールド名 | 型 | 説明 |
|-------------|------|------|
| `userCount` | number | 所属スタッフ数 |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

---

## 選択肢の値一覧

### ロール（role）
| 値 | 表示名 |
|----|--------|
| `platform_owner` | プラットフォームオーナー |
| `platform_staff` | 本社スタッフ |
| `company_admin` | 企業管理者 |
| `branch_manager` | 支店長 |
| `branch_staff` | 支店スタッフ |
| `accountant` | 顧問会計士 |
| `tax_advisor` | 顧問税理士 |

### 雇用形態（employmentType）
| 値 | 表示名 |
|----|--------|
| `full_time` | 正社員 |
| `part_time` | パート |
| `contract` | 契約社員 |
| `temporary` | 派遣社員 |
| `other` | その他 |

### 法人格（corporateType）
| 値 | 表示名 |
|----|--------|
| `kabushiki` | 株式会社 |
| `godo` | 合同会社 |
| `yugen` | 有限会社 |
| `npo` | NPO法人 |
| `shakai_fukushi` | 社会福祉法人 |
| `ippan_shadan` | 一般社団法人 |
| `ippan_zaidan` | 一般財団法人 |

### 福祉サービス種別（welfareServiceType）
| 値 | 表示名 |
|----|--------|
| `b_type` | 就労継続支援B型 |
| `a_type` | 就労継続支援A型 |
| `transition` | 就労移行支援 |
| `life_training` | 自立訓練（生活訓練） |
| `group_home` | グループホーム |
| `day_service` | 生活介護 |

---

## 注意事項

- ⚠️機密 マークのフィールドは、Firestore Security Rules で適切なアクセス制限が必要
- timestamp 型のフィールドは `serverTimestamp()` を使用して設定
- 日付型は `YYYY-MM-DD` 形式の文字列で保存
