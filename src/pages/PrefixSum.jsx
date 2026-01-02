import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Info, Settings } from 'lucide-react';

const DEFAULT_ARRAY = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PrefixSum = () => {
  // --- State: Data Source ---
  const [dataArray, setDataArray] = useState(DEFAULT_ARRAY);
  const [inputStr, setInputStr] = useState(DEFAULT_ARRAY.join(", "));
  const N = dataArray.length;

  // --- State: Inputs & Logic ---
  const [rangeL, setRangeL] = useState(2);
  const [rangeR, setRangeR] = useState(6);
  const [isPreprocessed, setIsPreprocessed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [globalStatus, setGlobalStatus] = useState({ text: 'Ready', type: 'neutral' }); // neutral, busy, success

  // --- Speed Control ---
  // Default 500ms. We use a Ref so running loops can read the latest value immediately.
  const [speed, setSpeed] = useState(500); 
  const speedRef = useRef(500);

  // --- State: Data Arrays ---
  const [prefixArray, setPrefixArray] = useState(new Array(N).fill(null)); // null means show '?' or empty
  
  // --- State: Animation Highlights & Stats (Normal Loop) ---
  const [normalStats, setNormalStats] = useState({
    sum: 0,
    ops: 0,
    opText: 'Waiting...',
    currentIdx: null, // index being scanned
    processedIndices: [], // indices already processed
  });

  // --- State: Animation Highlights & Stats (Prefix Sum) ---
  const [prefixStats, setPrefixStats] = useState({
    result: 0,
    ops: 0,
    opText: 'Waiting...',
    scanIdx: null, // current input index being scanned (for build)
    prevSumIdx: null, // previous prefix sum index (for build)
    resultIdx: null, // current prefix sum index just written (for build) or query result (for query)
    subtractIdx: null, // index being subtracted (L-1)
  });

  // --- Helpers ---
  const resetVisuals = () => {
    setNormalStats({
      sum: 0,
      ops: 0,
      opText: 'Waiting...',
      currentIdx: null,
      processedIndices: [],
    });
    setPrefixStats({
      result: 0,
      ops: 0,
      opText: isPreprocessed ? 'Waiting for query...' : 'Waiting...',
      scanIdx: null,
      prevSumIdx: null,
      resultIdx: null,
      subtractIdx: null,
    });
  };

  const handleResetAll = () => {
    setIsPreprocessed(false);
    setPrefixArray(new Array(dataArray.length).fill(null));
    resetVisuals();
    setGlobalStatus({ text: 'Ready', type: 'neutral' });
    setIsRunning(false);
  };

  // Reset when dataArray changes
  useEffect(() => {
    handleResetAll();
    // Adjust ranges if they are out of bounds for the new array
    if (rangeL >= dataArray.length) setRangeL(0);
    if (rangeR >= dataArray.length) setRangeR(dataArray.length - 1);
  }, [dataArray]);

  const handleUpdateArray = () => {
    const newArr = inputStr.split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (newArr.length === 0) {
      alert("Please enter at least one valid number.");
      return;
    }
    if (newArr.length > 15) {
      alert("For the best visualization experience, please keep the array size under 15.");
      return;
    }

    setDataArray(newArr);
  };

  // --- Animation Logic: Normal Loop ---
  const runNormalLoopAnimation = async (L, R) => {
    let sum = 0;
    let ops = 0;

    setNormalStats(prev => ({ ...prev, opText: 'sum += arr[i]' }));

    for (let i = L; i <= R; i++) {
      // Highlight scan
      setNormalStats(prev => ({ ...prev, currentIdx: i }));
      
      // Use dynamic speed
      await sleep(speedRef.current); 

      sum += dataArray[i];
      ops++;

      setNormalStats(prev => ({
        ...prev,
        sum,
        ops,
        opText: `sum = ${sum - dataArray[i]} + ${dataArray[i]}`,
        currentIdx: null,
        processedIndices: [...prev.processedIndices, i]
      }));
    }

    setNormalStats(prev => ({ ...prev, opText: 'Done', currentIdx: null }));
  };

  // --- Animation Logic: Prefix Build ---
  const runPreprocessingAnimation = async () => {
    setGlobalStatus({ text: 'Step 1: Building (O(N) Cost - Same as Normal Loop)...', type: 'busy' });
    
    let runningSum = 0;
    const newPrefixArr = new Array(N).fill(null);

    for (let i = 0; i < N; i++) {
      // Highlight Input
      setPrefixStats(prev => ({ ...prev, scanIdx: i }));

      // Highlight Previous Sum if exists
      if (i > 0) {
        setPrefixStats(prev => ({ 
            ...prev, 
            prevSumIdx: i - 1,
            opText: `P[${i}] = P[${i-1}] (${newPrefixArr[i-1]}) + arr[${i}] (${dataArray[i]})`
        }));
      } else {
        setPrefixStats(prev => ({ 
            ...prev, 
            opText: `P[0] = arr[0] (${dataArray[i]})`
        }));
      }

      // 60% of base speed for operand viewing
      await sleep(speedRef.current * 0.6);

      // Calculation
      runningSum += dataArray[i];
      newPrefixArr[i] = runningSum;
      setPrefixArray([...newPrefixArr]);

      // Flash Result Green
      setPrefixStats(prev => ({ ...prev, resultIdx: i }));
      
      // 40% of base speed for result viewing
      await sleep(speedRef.current * 0.4);

      // Cleanup step highlights
      setPrefixStats(prev => ({ ...prev, scanIdx: null, prevSumIdx: null, resultIdx: null }));
    }

    setIsPreprocessed(true);
    setPrefixStats(prev => ({ ...prev, opText: 'Build Complete (O(N) done).' }));
    await sleep(speedRef.current);
  };

  // --- Animation Logic: Prefix Query ---
  const runPrefixQueryAnimation = async (L, R) => {
    // Initial pause relative to speed
    await sleep(speedRef.current * 0.4); 

    setPrefixStats(prev => ({ ...prev, opText: `P[${R}] - P[${L-1}]` }));

    // Highlight P[R] (Result/Green-ish)
    setPrefixStats(prev => ({ ...prev, resultIdx: R }));

    let valL = 0;
    // Highlight P[L-1] (Subtract/Red)
    if (L > 0) {
      setPrefixStats(prev => ({ ...prev, subtractIdx: L - 1 }));
      valL = prefixArray[L - 1];
       setPrefixStats(prev => ({ ...prev, opText: `${prefixArray[R]} - ${valL}` }));
    } else {
       setPrefixStats(prev => ({ ...prev, opText: `${prefixArray[R]} - 0` }));
    }

    // Calculation pause relative to speed
    await sleep(speedRef.current * 1.2); 

    const result = prefixArray[R] - valL;
    
    setPrefixStats(prev => ({
      ...prev,
      result,
      ops: 1,
      opText: `Result: ${result}`
    }));
  };

  // --- Main Orchestrator ---
  const runComparison = async () => {
    if (rangeL > rangeR || rangeL < 0 || rangeR >= N) {
      alert(`Please enter valid indices (L <= R) within 0-${N - 1}`);
      return;
    }

    setIsRunning(true);
    resetVisuals();

    // 1. Build if needed
    if (!isPreprocessed) {
      await runPreprocessingAnimation();
    }

    // 2. Run Comparison
    setGlobalStatus({ text: 'Step 2: Querying (O(1) - Instant)...', type: 'busy' });
    
    await Promise.all([
      runNormalLoopAnimation(rangeL, rangeR),
      runPrefixQueryAnimation(rangeL, rangeR)
    ]);

    setGlobalStatus({ text: 'Comparison Complete!', type: 'success' });
    setIsRunning(false);
  };

  // --- Sub-Component: Array Cell ---
  const Cell = ({ value, label, isHighlighted, isResult, isSubtract, isProcessed, small = false }) => {
    let baseClass = "relative flex items-center justify-center border border-slate-300 rounded font-bold transition-all duration-300 ease-in-out m-0.5";
    let sizeClass = small ? "w-6 h-6 text-[10px]" : "w-10 h-10 md:w-12 md:h-12 text-base";
    let colorClass = "bg-white text-slate-700";

    if (isProcessed) colorClass = "bg-slate-200 text-slate-400 opacity-60";
    if (isHighlighted) colorClass = "bg-blue-500 text-white transform scale-110 shadow-lg border-blue-600 z-10";
    if (isResult) colorClass = "bg-emerald-500 text-white transform scale-110 shadow-lg border-emerald-600 z-10";
    if (isSubtract) colorClass = "bg-red-500 text-white transform scale-110 border-red-600 z-10";

    return (
      <div className={`${baseClass} ${sizeClass} ${colorClass}`}>
        <span className="z-10">{value}</span>
        {!small && (
          <span className="absolute -top-4 text-[10px] text-slate-400 font-normal">
            {label}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center p-4 md:p-8 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Prefix Sum Tradeoff</h1>
        <p className="text-slate-600 dark:text-slate-400">
          The Loop is <span className="font-bold text-red-600 dark:text-red-500">NOT</span> Faster &mdash; The Reuse is.
        </p>
      </div>

      {/* Controls Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col gap-6 items-center justify-center border border-slate-200 dark:border-slate-700 sticky top-4 z-50 mb-8 w-full max-w-4xl">
        
        {/* Row 1: Data Source */}
        <div className="w-full flex flex-col md:flex-row items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
           <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
             <Settings size={14} /> Data Source
           </span>
           <div className="flex-1 w-full flex gap-2">
             <input 
               type="text" 
               value={inputStr}
               onChange={(e) => setInputStr(e.target.value)}
               placeholder="Enter numbers separated by comma (e.g. 1, 2, 3)"
               className="flex-1 p-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
             />
             <button 
               onClick={handleUpdateArray}
               disabled={isRunning}
               className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
             >
               Update Array
             </button>
           </div>
        </div>

        {/* Row 2: Controls */}
        <div className="flex flex-wrap gap-6 items-center justify-center w-full">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Start (L):</label>
              <input 
                type="number" 
                value={rangeL} 
                onChange={(e) => setRangeL(parseInt(e.target.value) || 0)}
                min={0} max={N-1}
                className="w-16 p-2 border rounded-lg text-center font-bold text-slate-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">End (R):</label>
              <input 
                 type="number" 
                 value={rangeR} 
                 onChange={(e) => setRangeR(parseInt(e.target.value) || 0)}
                 min={0} max={N-1}
                 className="w-16 p-2 border rounded-lg text-center font-bold text-slate-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden md:block"></div>

            {/* Speed Control */}
            <div className="flex flex-col items-center justify-center gap-1 mx-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Speed</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Slow</span>
                    <input 
                        type="range" 
                        min="100" 
                        max="1500" 
                        step="100"
                        // Invert value so Right is Fast (Low Delay), Left is Slow (High Delay)
                        value={1600 - speed} 
                        onChange={(e) => {
                            const val = 1600 - parseInt(e.target.value);
                            setSpeed(val);
                            speedRef.current = val;
                        }}
                        className="w-24 md:w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Fast</span>
                </div>
            </div>

            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden md:block"></div>

            <button 
              onClick={runComparison}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-bold text-lg shadow-md transition flex items-center gap-2 transform active:scale-95 
                ${isRunning ? 'bg-slate-400 cursor-not-allowed text-slate-100' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'}`}
            >
              <Play size={20} fill="currentColor" />
              <span>Run</span>
            </button>

            <button 
              onClick={handleResetAll}
              className="ml-auto text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline text-sm flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Reset
            </button>
        </div>
      </div>

      {/* Main Visualization Box */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-6xl">
        
        {/* Box Header */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 dark:text-slate-300 text-lg">Live Analysis</h2>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 font-mono flex items-center gap-2">
            Status: 
            <span className={`px-2 py-1 rounded text-slate-700 dark:text-slate-300 transition-colors duration-300
              ${globalStatus.type === 'busy' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 animate-pulse' : 
                globalStatus.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}
            `}>
              {globalStatus.text}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
          
          {/* LEFT PANEL: Normal Loop */}
          <div className="p-6 flex flex-col bg-red-50/10 dark:bg-red-950/10 min-h-[400px]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">1. Normal Loop</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculating sum fresh every time.</p>
              </div>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded border border-slate-200 dark:border-slate-600">O(N) Time</span>
            </div>

            <div className="flex justify-center mb-8 h-16 flex-wrap content-center gap-y-6">
              {dataArray.map((val, idx) => (
                <Cell 
                  key={`norm-${idx}`} 
                  value={val} 
                  label={idx} 
                  isHighlighted={normalStats.currentIdx === idx}
                  isProcessed={normalStats.processedIndices.includes(idx) && normalStats.currentIdx !== idx}
                />
              ))}
            </div>

            <div className="mt-auto bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operation</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-sm">{normalStats.opText}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Sum</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{normalStats.sum}</span>
               </div>
               <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 text-right">
                 Operations: <span className="font-bold text-slate-700 dark:text-slate-300">{normalStats.ops}</span>
               </div>
            </div>
          </div>

          {/* RIGHT PANEL: Prefix Sum */}
          <div className="p-6 flex flex-col bg-emerald-50/10 dark:bg-emerald-950/10 min-h-[400px]">
             <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">2. Prefix Sum</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Step 1: Build (O(N)) &rarr; Step 2: Query (O(1))</p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded border transition-colors duration-300
                  ${isPreprocessed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}
              `}>
                {isPreprocessed ? 'Built (O(1) Ready)' : 'Not Built'}
              </span>
            </div>

            {/* Input Array Mini */}
            <div className="mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Input Array (arr)</div>
            <div className="flex justify-center mb-4 h-8 flex-wrap content-center gap-y-6">
              {dataArray.map((val, idx) => (
                <Cell 
                  key={`pref-in-${idx}`} 
                  value={val} 
                  label={idx} 
                  small 
                  isHighlighted={prefixStats.scanIdx === idx}
                />
              ))}
            </div>

            {/* Prefix Array Main */}
            <div className="mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Prefix Array (P)</div>
            <div className="flex justify-center mb-8 h-16 flex-wrap content-center gap-y-6">
              {prefixArray.map((val, idx) => (
                <Cell 
                  key={`pref-sum-${idx}`} 
                  value={val === null ? '?' : val} 
                  label={idx}
                  isHighlighted={prefixStats.prevSumIdx === idx} // Blue for previous sum operand
                  isResult={prefixStats.resultIdx === idx} // Green for result/current write
                  isSubtract={prefixStats.subtractIdx === idx} // Red for L-1
                />
              ))}
            </div>

            <div className="mt-auto bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Formula</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{prefixStats.opText}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Result</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{prefixStats.result}</span>
               </div>
               <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 text-right">
                 Operations: <span className="font-bold text-slate-700 dark:text-slate-300">{prefixStats.ops}</span>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl mt-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-900 dark:text-yellow-200 shadow-sm flex gap-3">
            <div className="mt-0.5"><Info size={18} className="text-yellow-700 dark:text-yellow-400" /></div>
            <div>
                <strong className="block mb-1 text-yellow-700 dark:text-yellow-400 text-base">🔴 Myth: "Prefix Sum is faster addition"</strong>
                <p>It is NOT faster. Building the array takes <strong>O(N)</strong>, just like a normal loop. They perform the exact same number of additions initially. There is no magic speedup in the summation itself.</p>
            </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-sm text-emerald-900 dark:text-emerald-200 shadow-sm flex gap-3">
             <div className="mt-0.5"><Info size={18} className="text-emerald-700 dark:text-emerald-400" /></div>
            <div>
                <strong className="block mb-1 text-emerald-700 dark:text-emerald-400 text-base">🟢 Truth: "It's a Memory-Time Tradeoff"</strong>
                <p>We spend time and memory <em>once</em> to build it. We gain speed on <em>future</em> queries. It doesn't speed up addition; it eliminates <em>repetition</em> by remembering history.</p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default PrefixSum;