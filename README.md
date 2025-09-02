# Gravity Chinese Sentence Builder

A interactive website where users can drag Chinese character squares to create sentences with realistic physics and 3D effects.

## Features

- **Draggable Chinese Characters**: Drag words from the palette to the playground
- **Physics Engine**: Realistic gravity and collision effects using Matter.js
- **3D Visual Effects**: CSS3 transforms for depth and rotation
- **Sentence Building**: Words automatically form sentences when placed in the bottom area
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Open `index.html`** in your web browser
2. **Drag characters** from the left palette to the main area
3. **Toggle gravity** to enable/disable physics effects
4. **Create sentences** by positioning characters in the bottom area
5. **Add more words** using the "添加汉字" button
6. **Reset** the playground anytime with the reset button

## Controls

- **重置 Reset**: Clear all words from the playground
- **重力开关 Toggle Gravity**: Enable/disable physics simulation
- **添加汉字 Add Word**: Add a random Chinese character to the playground

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantics
- **CSS3**: 3D transforms, animations, and responsive design
- **JavaScript**: Interactive functionality and game logic
- **Matter.js**: 2D physics engine for realistic movement and collisions
- **Three.js**: (Referenced for future 3D enhancements)

### File Structure
```
gravity-sentence/
├── index.html          # Main HTML file
├── style.css           # CSS styles and animations
├── script.js           # JavaScript logic and physics
└── README.md          # This documentation
```

### Chinese Characters Included
The application includes common Chinese characters for:
- Pronouns: 我 (I), 你 (you), 他 (he), 她 (she), 它 (it)
- Verbs: 爱 (love), 喜欢 (like), 看 (see), 听 (hear), 吃 (eat)
- Adjectives: 大 (big), 小 (small), 好 (good), 坏 (bad), 美 (beautiful)
- Nouns: 书 (book), 水 (water), 火 (fire), 山 (mountain), 树 (tree)
- Time words: 今天 (today), 明天 (tomorrow), 昨天 (yesterday)
- And many more...

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Development

To modify or extend the application:

1. **Add new characters**: Edit the `chineseWords` array in `script.js`
2. **Customize physics**: Modify Matter.js settings in the `setupPhysics()` function
3. **Change styling**: Update CSS properties in `style.css`
4. **Add new features**: Extend the JavaScript functionality in `script.js`

## Future Enhancements

- Voice recognition for Chinese pronunciation
- Character stroke animations
- Difficulty levels for language learning
- Save/load sentence compositions
- Multi-user collaborative mode
- Enhanced 3D effects with Three.js integration

## License

This project is open source and available under the MIT License.
