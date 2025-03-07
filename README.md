# Directory Visualizer

A powerful and intuitive tool for visualizing directory structures with multiple view options.

## Features

- 🌳 Tree View: Traditional directory tree visualization
- 📊 Graph View: Interactive node-based visualization
- 📝 Text View: Plain text representation
- 🔍 Comprehension View: Detailed analysis of file structure with content preview
- 🔄 Multiple Input Sources: Support for local directories and GitHub repositories
- ⚙️ Customizable Settings: Filter file types and control visualization options
- 🎨 Beautiful UI: Modern, responsive design with smooth transitions
- 🌓 Dark Mode: Toggle between light and dark themes for comfortable viewing
- 💾 Export Options: Save visualizations as JSON, PNG, or plain text
- 🔑 GitHub Integration: Use personal access tokens for private repositories
- 🔄 Reload Feature: Refresh visualization with updated settings
- 🚀 Performance Optimized: Fast loading with caching and batch processing

## Software Compatibility

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Browser**: 
  - Chrome 80+
  - Firefox 75+
  - Safari 13.1+
  - Edge 80+
- **Hardware**:
  - Minimum 4GB RAM
  - Modern CPU (2015+)
  - 1GB free disk space

### Technical Requirements

- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **Screen Resolution**: Minimum 1280x720

### Browser Features Required

- WebAssembly support
- ES2020 JavaScript features
- Local file system access (for local directory visualization)
- WebGL (for graph visualization)

### Known Limitations

- Local directory access requires a modern browser with File System Access API support
- GitHub repository size limit: 100MB
- Maximum directory depth: 10 levels
- File count limit: 10,000 files per directory

## Installation

```bash
# Clone the repository
git clone https://github.com/LaneZero/FolderFusionX.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

This project can be deployed to GitHub Pages using the following steps:

1. Fork this repository to your GitHub account
2. Clone your forked repository
3. Make any desired changes
4. Push your changes to GitHub
5. Enable GitHub Pages in your repository settings
6. The GitHub Actions workflow will automatically deploy your site

Alternatively, you can manually deploy using:

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Security

- GitHub tokens are stored securely in your browser's session storage
- Tokens are never sent to any server other than GitHub's API
- Session storage is cleared when you close your browser
- We recommend using tokens with minimal permissions (public_repo scope only)
- Never share your personal access tokens with anyone

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

If you find this project helpful, consider:

- ⭐ Starring the repository
- ☕ [Buying me a coffee](https://www.coffeete.ir/AhmadR3zA)
- 🐛 Reporting issues
- 🤝 Contributing to the codebase

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.