# Quick Test Guide - TTS Voice Template

## Run the Application
```bash
npm run dev
```

## Test Commands

### ✅ Test 1: Simple voice request
**Type in chat:**
```
build me an ai voice
```

**Expected Result:**
- Console shows: `[Agent] ✓ Matched TTS template`
- File Explorer opens: `Documents/AI Projects/ai-voice-generator/`
- VSCode opens with `index.html`
- Browser opens with voice app
- Can type text and hear it spoken

---

### ✅ Test 2: Original user request
**Type in chat:**
```
build me an ai voice that whatever i prompt it to say it then says it
```

**Expected Result:**
- Same as Test 1 (longer description handled)
- Agent recognizes it as project_generation intent
- Builds and opens TTS app

---

### ✅ Test 3: Alternative phrasing
**Type in chat:**
```
create a text to speech app
```

**Expected Result:**
- Builds TTS app (recognizes "text to speech")

---

### ✅ Test 4: Another variation
**Type in chat:**
```
make me something that can speak text
```

**Expected Result:**
- Builds TTS app (recognizes "speak")

---

### ✅ Test 5: Conversation (should NOT build)
**Type in chat:**
```
stop
```

**Expected Result:**
- Responds conversationally
- Does NOT try to build anything

---

## Testing the Voice App

Once the browser opens with the voice app:

1. **Type text** in the large textarea
2. **Click "Speak"** button (or press Ctrl+Enter)
3. **Hear your browser speak the text**

### Try These Features:
- 🎤 Change voice from dropdown
- ⚡ Adjust speed slider (0.5x to 2x)
- 🎵 Adjust pitch slider
- ⏸️ Click "Pause" while speaking
- ▶️ Click "Resume" to continue
- ⏹️ Click "Stop" to cancel
- 🎯 Click any "Quick Phrase" button

---

## Console Debugging

### Good Console Output:
```
[Agent] NEW MESSAGE: build me an ai voice
[IntentAnalyzer] Quick detection for: build me an ai voice
[IntentAnalyzer] ✓ Matched build pattern
[Agent] Intent type: project_generation
[Agent] → Handling as PROJECT GENERATION
[Agent] ✓ Matched TTS template
[Desktop Control] Opening File Explorer
[Desktop Control] Opening VSCode
[Desktop Control] Opening Browser
```

### If Not Working:
Check these lines in console:
```
[IntentAnalyzer] Has voice keyword: true  ✅
[IntentAnalyzer] Has build keyword: true  ✅
```

Both should be `true` for voice requests.

---

## File Locations

**Template Code:**
- `apps/main/desktop-control/templates.ts` (getTextToSpeechTemplate method)

**Template Selection:**
- `apps/main/agent/orchestrator.ts` (selectProjectTemplate method)

**Intent Detection:**
- `apps/main/agent/intent-analyzer.ts` (quickIntentDetection method)

**Generated Project:**
- `C:\Users\willi\Documents\AI Projects\ai-voice-generator\`

---

## Troubleshooting

### Problem: Agent doesn't recognize "build me an ai voice"
**Solution:** Check intent-analyzer.ts console output for pattern matching

### Problem: VSCode or Browser doesn't open
**Solution:** Check visual-builder.ts event logs

### Problem: Voice doesn't speak in browser
**Solution:** 
- Try Chrome/Edge (best Web Speech API support)
- Check browser permissions for audio
- Try a different voice from dropdown

---

## Success Criteria

✅ Typing "build me an ai voice" triggers project_generation intent
✅ Console shows "[Agent] ✓ Matched TTS template"
✅ File Explorer opens to project folder
✅ VSCode opens with index.html visible
✅ Browser opens with purple gradient voice app
✅ Typing text and clicking "Speak" makes browser speak
✅ All playback controls work (pause, resume, stop)
✅ Voice dropdown shows multiple voices
✅ Speed and pitch sliders adjust audio output
✅ Quick phrase buttons work

---

**Ready to test!** 🚀

Run `npm run dev` and type: **build me an ai voice**

