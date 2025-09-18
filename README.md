# 🌐 insportline-switcher.user.js

Skrypt użytkownika (UserScript) dodający elegancki **Material 3 switcher** do szybkiego przełączania się pomiędzy domenami **insportline** (`PL`, `CZ`, `EU`) z zachowaniem aktualnej ścieżki, parametrów i hashy.  
Obsługuje **SPAs**, **middle-click** (otwieranie w nowej karcie), a także wyświetla **dyskretną przypominajkę o aktualizacji**.

---

## ✨ Funkcje
- 🔄 **Przełączanie domen**: `e-insportline.pl` ↔ `insportline.cz` ↔ `insportline.eu`
- 📌 **Zachowanie URL**: ścieżka, query i hash zostają przeniesione 1:1
- 🖱 **Middle-click**: otwiera wybraną domenę w nowej karcie
- ⚡ **SPA friendly**: działa na stronach typu Single Page Application (np. sklepy online)
- 🎨 **Material 3 look**: przyciski w kolorach domen, z ładnymi cieniami i efektami hover
- 🔔 **Opcjonalne przypomnienie o aktualizacji** (lekka chmurka w rogu ekranu)

---

## 📸 Podgląd
*(przykładowy wygląd switchera — przyciski PL / CZ / EU obok logo strony)*  

> 🔴 **PL** | 🔵 **CZ** | 🟢 **EU**

---

## 📦 Instalacja
1. Zainstaluj rozszerzenie do obsługi UserScriptów:
   - [Tampermonkey](https://www.tampermonkey.net/) (zalecane)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/)
2. Kliknij tutaj, aby dodać skrypt:  
   👉 [**Zainstaluj insportline-switcher.user.js**](https://raw.githubusercontent.com/Steller25/insportline/main/insportline-switcher.user.js)

---

## 🔄 Obsługiwane domeny
- `https://e-insportline.pl/`
- `https://insportline.cz/`
- `https://insportline.eu/`  
*(w wersjach z i bez `www`)*

---

## 🛠 Aktualizacje
Skrypt sam sprawdza plik [`latest.json`](https://github.com/Steller25/insportline/blob/main/latest.json) i jeśli znajdzie nowszą wersję niż Twoja — pokaże w rogu ekranu przypominajkę z linkiem **Zainstaluj**.  

---

## 🤝 Wsparcie i zgłoszenia błędów
- Strona projektu: [GitHub – Steller25/insportline](https://github.com/Steller25/insportline)
- Zgłoś problem: [Issues](https://github.com/Steller25/insportline/issues)

---

## 📜 Licencja
MIT — rób z tym, co chcesz. 🚀
