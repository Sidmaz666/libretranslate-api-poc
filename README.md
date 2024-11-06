## Libre Tranlate API

This script utilizes the libre translate api on the <a href="https://libretranslate.com/">Libretranslate</a> website. The code mimics the excat API call as from teh website and hence able to get the translated data.

## Endpoints

### `/ - (GET)`

1. List and Information of Available Languages.

### `/translate - (POST)`

1. Payload Data 
  ```
{
  "q": "Hello, how are you doing?",
    "source": "auto",
    "target": "hi",
    "format": "text",
    "alternatives": 3,
    "api_key": "",
    "secret": ""
}
  ````

2. Expected Response
```
   {
  "success": true,
  "message": "Translation request processed.",
  "payload": {
    "q": "Hello, how are you doing?",
    "source": "auto",
    "target": "hi",
    "format": "text",
    "alternatives": 3,
    "api_key": "",
    "secret": "04RAFYG"
  },
  "data": {
    "alternatives": [
      "नमस्ते, आप कैसे कर रहे हैं?",
      "हैलो, आप कैसे कर रहे हैं?",
      "हैलो, तुम कैसे कर रहे हो?"
    ],
    "detectedLanguage": {
      "confidence": 86,
      "language": "en"
    },
    "translatedText": "नमस्कार, आप कैसे कर रहे हैं?"
  }
}
```
