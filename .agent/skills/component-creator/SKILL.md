---
name: component-creator
description: React bileşeni oluşturur. Yeni UI bileşeni veya sayfa bileşeni eklerken kullan.
---
# Component Creator Skill

Her bileşen şu kurallara uymalı:
1. TypeScript ile yazılmalı, props interface'i tanımlanmalı
2. 'use client' sadece interaktif bileşenlerde kullanılmalı (form, onClick vb.)
3. Server Component tercih et, gerekmedikçe client yapma
4. Tailwind CSS kullan, className'leri cn() helper ile birleştir
5. Loading state: Skeleton loader ile
6. Error state: Hata mesajı + retry butonu
7. Empty state: İkon + açıklama + aksiyon butonu
8. Erişilebilirlik: aria-label, role, keyboard navigation
9. shadcn/ui bileşenlerini import et, sıfırdan yazma
