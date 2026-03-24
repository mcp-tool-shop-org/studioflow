<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

यह एक डेस्कटॉप एप्लिकेशन है जो रचनात्मक कार्यों के लिए एक कार्यक्षेत्र प्रदान करता है और विभिन्न पहलुओं का परीक्षण करने के लिए एक मंच है। यह Tauri v2 पर आधारित है और इसका उपयोग विज़ुअल एडिटिंग के लिए किया जाता है, जिसमें डोमेन-आधारित स्टेट मैनेजमेंट शामिल है। इसे स्वतंत्र एआई एजेंटों के निष्पादन को वास्तविक उत्पाद कार्यों के माध्यम से प्रदर्शित करने के लिए बनाया गया है।

## शुरुआत कैसे करें

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## आर्किटेक्चर

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## तकनीकी विवरण

- **Tauri v2**: रस्ट बैकएंड, नेटिव डेस्कटॉप विंडो
- **React**: यूआई घटक
- **Zustand**: डोमेन-आधारित स्टोर्स के साथ स्टेट मैनेजमेंट
- **Vite**: बिल्ड टूलिंग
- **Vitest**: परीक्षण ढांचा (डोमेन, स्टेट और घटकों से संबंधित 12 परीक्षण फाइलें)
- **pnpm workspaces**: मोनोरेपो
- **Claude Agent SDK**: मल्टी-क्लाउड ऑर्केस्ट्रेशन का परीक्षण करने का मंच

## मल्टी-क्लाउड परीक्षण मंच

StudioFlow मल्टी-क्लाउड एजेंट ऑर्केस्ट्रेशन के लिए प्राथमिक परीक्षण मंच के रूप में कार्य करता है। चरण 5 में, SDK रनटाइम के तहत स्वतंत्र बिल्डर और सत्यापनकर्ता निष्पादन का प्रदर्शन किया गया:

- 4 बिल्डर पैकेट्स अलग-अलग गिट वर्कट्री में चलाए गए।
- 2 समानांतर प्रक्रियाएं वास्तविक भूमिका स्वतंत्रता के साथ निष्पादित की गईं।
- सत्यापनकर्ता एक रीड-ओनली सत्र में 20 सत्यापन बिंदुओं की जांच करता है।
- इंटीग्रेटर सभी कार्यों को एक नियंत्रित सत्र के माध्यम से मर्ज करता है।

पूर्ण परीक्षण विवरण के लिए `PHASE-5-CONTRACT.md` और `PHASE-6-POSTMORTEM.md` देखें।

## सुरक्षा

StudioFlow एक **केवल स्थानीय डेस्कटॉप एप्लिकेशन** है। यह इंटरनेट से नहीं जुड़ता है और न ही कोई डेटा एकत्र करता है।

- **पढ़ता है:** प्रोजेक्ट फाइलें (JSON), कैनवस स्टेट, लेयर डेटा
- **लिखता है:** प्रोजेक्ट सेव फाइलें केवल स्थानीय स्टोरेज में
- **प्रभावित नहीं करता:** नेटवर्क, क्लाउड सेवाएं, उपयोगकर्ता खाते, एनालिटिक्स
- **कोई टेलीमेट्री नहीं**: यह स्पष्ट रूप से बताया गया है।

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

## लाइसेंस

MIT

---

यह <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
