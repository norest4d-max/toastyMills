import { useState } from 'react';
import './App.css';
import dictionary from './data/dictionary';
import DictionaryBrowser from './components/DictionaryBrowser';
import SimilarityGame from './components/SimilarityGame';

const TABS = ['Dictionary', 'Similarity Game'];

function App() {
  const [activeTab, setActiveTab] = useState('Dictionary');

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">📖 ToastyMills</h1>
        <p className="App-subtitle">Explore vocabulary and test your word connections</p>
        <nav className="App-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`App-tab${activeTab === tab ? ' App-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="App-main">
        {activeTab === 'Dictionary' && (
          <DictionaryBrowser terms={dictionary} />
        )}
        {activeTab === 'Similarity Game' && (
          <SimilarityGame terms={dictionary} />
        )}
      </main>
    </div>
  );
}

export default App;
