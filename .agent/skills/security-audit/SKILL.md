---
name: security-audit
description: Güvenlik kontrolü yapar. Yeni özellik tamamlandığında veya güvenlikle ilgili kod yazıldığında kullan.
---
# Security Audit Skill

Her kod değişikliğinde şunları kontrol et:
1. SUPABASE_SERVICE_ROLE_KEY client tarafında mı? → YASAK
2. Kullanıcı inputu doğrudan SQL'e gidiyor mu? → YASAK
3. API route'da auth kontrolü var mı? → ZORUNLU
4. API route'da rol kontrolü var mı? → ZORUNLU
5. Hassas veri loglanıyor mu? → YASAK
6. Error response'da stack trace var mı? → YASAK
7. CORS ayarları doğru mu?
8. Rate limiting uygulanmış mı?
9. Audit log'a kayıt ekleniyor mu? (veri değişikliği varsa)
10. RLS policy'leri doğru mu? (Supabase dashboard'dan test et)
