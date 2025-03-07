import React, { useState, useEffect } from 'react';
import { TreeView } from './components/TreeView';
import { TextView } from './components/TextView';
import { GraphView } from './components/GraphView';
import { ComprehensionView } from './components/ComprehensionView';
import { PathInput } from './components/PathInput';
import { ProgressBar } from './components/ProgressBar';
import { SettingsModal } from './components/SettingsModal';
import { VersionInfo } from './components/VersionInfo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { CryptoWallet } from './components/CryptoWallet';
import { FileNode, VisualizationOptions, ProcessingStatus, DirectoryInput, DEFAULT_FILE_FORMATS, INITIAL_DEFAULT_FOLDERS } from './types/FileSystem';
import { parseLocalPath, fetchGitHubContents } from './utils/fileSystem';
import { getGitHubToken, storeGitHubToken } from './utils/tokenStorage';
import { logger } from './utils/logger';
import { Settings, Moon, Sun, FolderTree, BarChart2, FileText, BookOpen, RefreshCw, Github, FileCode, HelpCircle, X, Zap, Eye, Code, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Default visualization options
const DEFAULT_OPTIONS: VisualizationOptions = {
  maxDepth: 5,
  showHidden: false,
  fileTypes: [],
  excludePatterns: [...INITIAL_DEFAULT_FOLDERS],
  customExtensions: [],
  comprehensionMode: false,
  enabledFormats: Object.keys(DEFAULT_FILE_FORMATS).reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<string, boolean>),
  showProgressBar: true,
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
};

// View types
type ViewType = 'tree' | 'graph' | 'text' | 'comprehension';

function App() {
  const { t, i18n } = useTranslation();
  
  // State for file system data and UI
  const [data, setData] = useState<FileNode | null>(null);
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [options, setOptions] = useState<VisualizationOptions>(() => {
    // Load options from localStorage if available
    const savedOptions = localStorage.getItem('visualization-options');
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions);
        // Check for GitHub token in session storage
        const token = getGitHubToken();
        if (token) {
          parsedOptions.githubToken = token;
        }
        return parsedOptions;
      } catch (error) {
        logger.error('Failed to parse saved options', { error });
        return DEFAULT_OPTIONS;
      }
    }
    return DEFAULT_OPTIONS;
  });

  // Processing status state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    status: 'idle'
  });

  // Save options to localStorage when they change
  useEffect(() => {
    try {
      // Don't save the token to localStorage for security
      const optionsToSave = { ...options };
      delete optionsToSave.githubToken;
      
      localStorage.setItem('visualization-options', JSON.stringify(optionsToSave));
      
      // Store token separately in session storage
      if (options.githubToken) {
        storeGitHubToken(options.githubToken);
      }
    } catch (error) {
      logger.error('Failed to save options', { error });
    }
  }, [options]);

  // Handle directory input submission
  const handleDirectorySubmit = async (input: DirectoryInput) => {
    setIsLoading(true);
    setProcessingStatus({
      total: 0,
      processed: 0,
      status: 'processing',
      abortController: new AbortController()
    });

    try {
      let result: FileNode;

      if (input.type === 'local') {
        result = await parseLocalPath(input.value, options);
      } else {
        // GitHub repository
        result = await fetchGitHubContents(
          input.value, 
          options,
          processingStatus.abortController?.signal
        );
      }

      setData(result);
      setProcessingStatus({
        total: processingStatus.total,
        processed: processingStatus.total,
        status: 'complete'
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        setProcessingStatus({
          ...processingStatus,
          status: 'idle'
        });
      } else if (error.message?.includes('timed out')) {
        setProcessingStatus({
          ...processingStatus,
          status: 'timeout'
        });
        logger.error('Request timed out', { error });
      } else {
        setProcessingStatus({
          ...processingStatus,
          status: 'error',
          error: error.message
        });
        logger.error('Error processing directory', { error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancellation of processing
  const handleCancelProcessing = () => {
    if (processingStatus.abortController) {
      processingStatus.abortController.abort();
      setProcessingStatus({
        ...processingStatus,
        status: 'idle'
      });
      setIsLoading(false);
    }
  };

  // Update processing status
  const updateProcessingStatus = (status: Partial<ProcessingStatus>) => {
    setProcessingStatus(prev => ({
      ...prev,
      ...status
    }));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setOptions(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  };

  // Render the current view based on viewType
  const renderView = () => {
    if (!data) return null;

    switch (viewType) {
      case 'tree':
        return <TreeView data={data} darkMode={options.darkMode} />;
      case 'graph':
        return <GraphView data={data} darkMode={options.darkMode} />;
      case 'text':
        return <TextView data={data} darkMode={options.darkMode} />;
      case 'comprehension':
        return <ComprehensionView data={data} darkMode={options.darkMode} />;
      default:
        return <TreeView data={data} darkMode={options.darkMode} />;
    }
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (options.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [options.darkMode]);

  // Apply RTL direction for Persian language
  useEffect(() => {
    if (i18n.language === 'fa') {
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('font-persian');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.remove('font-persian');
    }
  }, [i18n.language]);

  // Help modal content
  const HelpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${options.darkMode ? 'text-white' : 'text-gray-800'}`}>
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <span>{t('help.title')}</span>
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{t('help.gettingStarted')}</h3>
              <p className="mb-2">{t('help.gettingStartedDesc')}</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>{t('quickStart.steps.0')}</li>
                <li>{t('quickStart.steps.1')}</li>
                <li>{t('quickStart.steps.2')}</li>
                <li>{t('quickStart.steps.3')}</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">{t('help.viewTypes')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <FolderTree className="w-5 h-5 mt-0.5 text-blue-500" />
                  <div>
                    <strong>{t('views.tree')}:</strong> {t('help.treeViewDesc')}
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart2 className="w-5 h-5 mt-0.5 text-blue-500" />
                  <div>
                    <strong>{t('views.graph')}:</strong> {t('help.graphViewDesc')}
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-5 h-5 mt-0.5 text-blue-500" />
                  <div>
                    <strong>{t('views.text')}:</strong> {t('help.textViewDesc')}
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 mt-0.5 text-blue-500" />
                  <div>
                    <strong>{t('views.comprehension')}:</strong> {t('help.comprehensionViewDesc')}
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">{t('settings.title')}</h3>
              <p>{t('help.settingsDesc')}</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>{t('settings.githubApi')}</li>
                <li>{t('settings.fileFormats')}</li>
                <li>{t('settings.excludedFolders')}</li>
                <li>{t('settings.maxDepth')}</li>
                <li>{t('settings.darkMode')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">{t('help.tips')}</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('quickStart.steps.4')}</li>
                <li>{t('quickStart.steps.3')}</li>
                <li>{t('quickStart.steps.2')}</li>
                <li>{t('quickStart.steps.1')}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t px-6 py-4 flex justify-end dark:border-gray-700">
          <button
            onClick={() => setShowHelp(false)}
            className={`px-4 py-2 rounded-md transition-colors ${
              options.darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {t('help.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${options.darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`py-3 px-4 md:px-6 ${options.darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileCode className={`w-6 h-6 ${options.darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className="text-xl font-bold">{t('app.title')}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CryptoWallet darkMode={options.darkMode} />
            <LanguageSwitcher darkMode={options.darkMode} />
            <button
              onClick={() => setShowHelp(true)}
              className={`p-2 rounded-full ${options.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Help"
              title={t('header.help')}
            >
              <HelpCircle className={`w-5 h-5 ${options.darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${options.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Toggle dark mode"
              title={options.darkMode ? t('header.lightMode') : t('header.darkMode')}
            >
              {options.darkMode ? (
                <Sun className="w-5 h-5 text-yellow-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full ${options.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Settings"
              title={t('header.settings')}
            >
              <Settings className={`w-5 h-5 ${options.darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <a
              href="https://github.com/LaneZero/FolderFusionX"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-full ${options.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="GitHub Repository"
              title={t('header.github')}
            >
              <Github className={`w-5 h-5 ${options.darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <section className="mb-8">
          <PathInput 
            onSubmit={handleDirectorySubmit} 
            isLoading={isLoading}
            darkMode={options.darkMode}
          />
          
          {(processingStatus.status !== 'idle' || options.showProgressBar) && (
            <div className="mt-4">
              <ProgressBar 
                status={processingStatus} 
                onCancel={handleCancelProcessing}
                darkMode={options.darkMode}
              />
            </div>
          )}
        </section>

        {data && (
          <>
            <section className="mb-6">
              <div className={`flex flex-wrap gap-2 p-2 rounded-lg ${options.darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <button
                  onClick={() => setViewType('tree')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewType === 'tree'
                      ? options.darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : options.darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span>{t('views.tree')}</span>
                </button>
                <button
                  onClick={() => setViewType('graph')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewType === 'graph'
                      ? options.darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : options.darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>{t('views.graph')}</span>
                </button>
                <button
                  onClick={() => setViewType('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewType === 'text'
                      ? options.darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : options.darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('views.text')}</span>
                </button>
                <button
                  onClick={() => setViewType('comprehension')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewType === 'comprehension'
                      ? options.darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : options.darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t('views.comprehension')}</span>
                </button>
                <button
                  onClick={() => {
                    // Reload with current settings
                    window.location.reload();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ml-auto ${
                    options.darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={t('views.reload')}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('views.reload')}</span>
                </button>
              </div>
            </section>

            <section className={`rounded-lg overflow-hidden shadow-sm ${options.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {renderView()}
            </section>
          </>
        )}

        {!data && !isLoading && (
          <section className={`text-center py-8 ${options.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-full ${options.darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <FileCode className={`w-16 h-16 ${options.darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                {t('app.welcome')}
              </h2>
              
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                {t('app.description')}
              </p>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className={`rounded-xl p-6 text-left transition-transform hover:scale-105 ${
                  options.darkMode ? 'bg-gray-800 shadow-lg shadow-blue-900/10' : 'bg-white shadow-lg shadow-blue-100/50'
                }`}>
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${
                    options.darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Eye className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Multiple Views</h3>
                  <p className={`text-sm ${options.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Visualize your directories in tree, graph, text, or comprehension views for different perspectives.
                  </p>
                </div>
                
                <div className={`rounded-xl p-6 text-left transition-transform hover:scale-105 ${
                  options.darkMode ? 'bg-gray-800 shadow-lg shadow-purple-900/10' : 'bg-white shadow-lg shadow-purple-100/50'
                }`}>
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${
                    options.darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Github className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
                  <p className={`text-sm ${options.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Explore any GitHub repository structure without cloning, with support for private repos.
                  </p>
                </div>
                
                <div className={`rounded-xl p-6 text-left transition-transform hover:scale-105 ${
                  options.darkMode ? 'bg-gray-800 shadow-lg shadow-green-900/10' : 'bg-white shadow-lg shadow-green-100/50'
                }`}>
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${
                    options.darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Performance Optimized</h3>
                  <p className={`text-sm ${options.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Fast loading with caching and batch processing for smooth visualization of large directories.
                  </p>
                </div>
                
                <div className={`rounded-xl p-6 text-left transition-transform hover:scale-105 ${
                  options.darkMode ? 'bg-gray-800 shadow-lg shadow-amber-900/10' : 'bg-white shadow-lg shadow-amber-100/50'
                }`}>
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${
                    options.darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Code className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Developer Friendly</h3>
                  <p className={`text-sm ${options.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Export visualizations as JSON, PNG, or text for documentation and sharing with your team.
                  </p>
                </div>
              </div>
              
              {/* Quick Start Section */}
              <div className={`rounded-xl p-8 mb-8 text-left ${
                options.darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-blue-50'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`rounded-full p-2 ${
                    options.darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">{t('quickStart.title')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ol className="space-y-3">
                      {t('quickStart.steps', { returnObjects: true }).slice(0, 3).map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className={`rounded-full w-6 h-6 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            options.darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <ol className="space-y-3" start={4}>
                      {t('quickStart.steps', { returnObjects: true }).slice(3).map((step, index) => (
                        <li key={index + 3} className="flex items-start gap-3">
                          <div className={`rounded-full w-6 h-6 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            options.darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="text-sm font-medium">{index + 4}</span>
                          </div>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowHelp(true)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                    options.darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                  {t('buttons.learnMore')}
                </button>
                
                <a
                  href="https://github.com/LaneZero/FolderFusionX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                    options.darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className={`py-4 px-6 mt-8 ${options.darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} border-t`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-2 md:mb-0">
            <VersionInfo darkMode={options.darkMode} />
          </div>
          <div>
            &copy; {new Date().getFullYear()} {t('app.title')}. {t('footer.copyright')}
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        options={options}
        onOptionsChange={setOptions}
      />
      
      {showHelp && <HelpModal />}
    </div>
  );
}

export default App;