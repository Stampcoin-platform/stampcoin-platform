<#
.SYNOPSIS
  يقرأ ملف .env.local ويضبط كل الأزواج key=value كـ GitHub Actions repository secrets عبر gh (GitHub CLI).

.NOTE
  - يتطلّب وجود GitHub CLI (gh) مُثبتاً ومُسجّل الدخول (gh auth login).
  - لا يدعم هذا السكربت القيم متعددة الأسطر. إن لديك JSON كبير متعدد الأسطر، ضع قيمته مضغوطة على سطر واحد أو استخدم طريقة رفع مختلفة.
  - القيم الفارغة ستتخطّى (يمكن تعديل السلوك عبر الكود).

.PARAMETER EnvFile
  مسار ملف env. الافتراضي: .env.local

.PARAMETER Repo
  repo بصيغة owner/repo. الافتراضي: Stampcoin-platform/stampcoin-platform

.PARAMETER DryRun
  إن وُضِع، يعرض ماذا سيتم فعلياً بدون إجراء تغييرات.

.PARAMETER Prefix
  إن وُضع، يضبط فقط المتغيرات التي تبدأ بهذا البادئة (مثلاً "PROD_").

.PARAMETER Force
  إن لم يُستخدم، يطلب تأكيداً قبل التنفيذ (لا ينطبق على DryRun).

.EXAMPLE
  .\bulk-set-secrets-from-env.ps1 -EnvFile .env.local -Repo "Stampcoin-platform/stampcoin-platform"

  تشغيل Dry-Run:
  .\bulk-set-secrets-from-env.ps1 -DryRun

#>

param(
  [string]$EnvFile = ".env.local",
  [string]$Repo = "Stampcoin-platform/stampcoin-platform",
  [switch]$DryRun,
  [string]$Prefix = "",
  [switch]$Force
)

function Write-Masked {
  param([string]$val)
  if ($null -eq $val -or $val.Length -eq 0) { return "***empty***" }
  if ($val.Length -le 8) { return ("*" * $val.Length) }
  return ($val.Substring(0,4) + "..." + $val.Substring($val.Length-4))
}

# تحقق من وجود gh
try {
  $ghVersion = & gh --version 2>$null
} catch {
  Write-Error "GitHub CLI (gh) غير مثبت أو غير متاح في PATH. ثبّته ثم سجّل الدخول: gh auth login"
  exit 1
}

# تحقق من أن gh مسجل الدخول
try {
  $authStatus = & gh auth status 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "يبدو أن gh غير مسجّل الدخول. نفّذ: gh auth login"
    # لا نغلق التنفيذ هنا — قد يختار المستخدم متابعة
  }
} catch {
  Write-Warning "فشل التحقق من حالة المصادقة مع gh. تأكد أنك مُسجّل الدخول."
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "الملف '$EnvFile' غير موجود. حدّث المسار وحاول مرة أخرى."
  exit 1
}

# اقرأ الملف و解析 الأزواج key=value
$entries = @()
Get-Content $EnvFile -Raw | ForEach-Object {
  # قسم المحتوى إلى أسطر وتجاهل التعليقات والاسطر الفارغة
  $_ -split "`n" | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    # يسمح بالقيم التي تحتوي على = داخلها - نقسم على أول =
    $idx = $line.IndexOf("=")
    if ($idx -lt 0) { 
      Write-Warning "تجاهل: السطر غير بصيغة key=value -> '$line'"
      return
    }
    $key = $line.Substring(0,$idx).Trim()
    $rawVal = $line.Substring($idx+1).Trim()

    # احذف اقتباسات محيطة ' أو "
    if (($rawVal.StartsWith("'") -and $rawVal.EndsWith("'")) -or ($rawVal.StartsWith('"') -and $rawVal.EndsWith('"'))) {
      $value = $rawVal.Substring(1, $rawVal.Length-2)
    } else {
      $value = $rawVal
    }

    # استبدال متغيّرات البيئة المرجعية $VAR أو ${VAR} إن وُجدت داخل القيمة
    # (نقوم بتوسيع بسيط للمتغيرات الموجودة كـ $NAME أو ${NAME})
    $value = $value -replace '\$\{([^}]+)\}', { param($m) (Get-Item -Path Env:$($m.Groups[1].Value) -ErrorAction SilentlyContinue).Value }
    $value = $value -replace '\$([A-Za-z_][A-Za-z0-9_]*)', { param($m) (Get-Item -Path Env:$($m.Groups[1].Value) -ErrorAction SilentlyContinue).Value }

    $entries += [pscustomobject]@{ Key = $key; Value = $value }
  }
}

if ($entries.Count -eq 0) {
  Write-Error "لم يتم العثور على أي متغيرات قابلة للمعالجة في الملف."
  exit 1
}

# تصفية حسب البادئة إن وُجدت
if ($Prefix -ne "") {
  $entries = $entries | Where-Object { $_.Key.StartsWith($Prefix) }
  if ($entries.Count -eq 0) {
    Write-Error "لا توجد مفاتيح تبدأ بالبادئة '$Prefix'."
    exit 1
  }
}

Write-Host "ستتم معالجة $($entries.Count) متغير(ات) من '$EnvFile' إلى repository '$Repo'."

if (-not $DryRun -and -not $Force) {
  $ok = Read-Host "تابع؟ اكتب Y للموافقة"
  if ($ok -ne "Y" -and $ok -ne "y") {
    Write-Host "تم الإلغاء بناءً على طلب المستخدم."
    exit 0
  }
}

# تنفيذ (أو عرض) تحويل كل متغير إلى GitHub secret
foreach ($entry in $entries) {
  $name = $entry.Key
  $value = $entry.Value

  if ([string]::IsNullOrEmpty($value)) {
    Write-Warning "تخطي '$name' لأن القيمة فارغة."
    continue
  }

  $masked = Write-Masked -val $value

  if ($DryRun) {
    Write-Host "[DryRun] سيُنشأ/يُحدّث secret '$name' بقيمة: $masked"
    continue
  }

  try {
    # استدعاء gh لإعداد الـ secret; gh يشفّر تلقائياً قبل الإرسال
    # نمرّر القيمة مباشرة عبر وسيطة --body
    & gh secret set $name --body $value --repo $Repo 2>&1 | ForEach-Object { $_ } 
    if ($LASTEXITCODE -eq 0) {
      Write-Host "تم ضبط secret '$name' ($masked)"
    } else {
      Write-Warning "فشل ضبط '$name'. راجع مخرجات gh أعلاه."
    }
  } catch {
    Write-Error "حدث خطأ أثناء ضبط '$name': $_"
  }
}

Write-Host "انتهى التنفيذ."