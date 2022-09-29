import React from 'react';
import { createRoot } from 'react-dom/client';
import { exampleCache } from './extra/ffetchCaching';
import { example1 } from './ffetch1';
import { example2 } from './ffetch2';
import { example3 } from './ffetch3';
import { example4 } from './ffetch4';
import { example5 } from './ffetch5';
import { example6 } from './ffetchReplaceAxios';

// example1()
// example2()
// example3()
// example4()
// example5()
// example6()
exampleCache()


const App = () => <h1>Hi</h1>

const container = document.getElementById('root');
const root = createRoot(container!); 
root.render(<App />);
