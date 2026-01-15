# Vault policy: يسمح بالوصول المقيد لمسارات الأسرار الضرورية للوكيل
path "secret/data/stampcoin/*" {
  capabilities = ["read", "list"]
}

path "transit/keys/stampcoin-agent" {
  capabilities = ["read", "encrypt", "decrypt"]
}

# منع أي وصول إلى paths أخرى
# لا تتضمن capabilities مثل "create" أو "delete" هنا