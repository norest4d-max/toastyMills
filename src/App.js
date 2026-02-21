import { useState } from 'react';
import './App.css';
import dictionary from './data/dictionary';
import ToastyChat from './components/ToastyChat';
import DictionaryBrowser from './components/DictionaryBrowser';
import SimilarityGame from './components/SimilarityGame';

const TABS = [
  { id: 'chat',       label: '🔥 Chat' },
  { id: 'dictionary', label: '📖 Dictionary' },
  { id: 'game',       label: '🧠 Similarity Game' },
];

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">🍞 ToastyMills</h1>
        <p className="App-subtitle">Local-first vocabulary · thesaurus connections · word reasoning game</p>
        <nav className="App-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`App-tab${activeTab === tab.id ? ' App-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="App-main">
        {activeTab === 'chat' && (
          <ToastyChat terms={dictionary} />
        )}
        {activeTab === 'dictionary' && (
          <DictionaryBrowser terms={dictionary} />
        )}
        {activeTab === 'game' && (
          <SimilarityGame terms={dictionary} />
        )}
      </main>
    </div>
  );
}

export default App;
