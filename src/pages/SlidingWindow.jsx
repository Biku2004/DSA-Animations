import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings, ChevronRight, ChevronLeft } from 'lucide-react';

// Default configuration
const DEFAULT_ARRAY = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0];
const DEFAULT_K = 8;

const SlidingWindow = () => {
  // --- State ---
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [targetK, setTargetK] = useState(DEFAULT_K);
  
  // Algorithm State
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(-1); // Start before index 0
  const [currentSum, setCurrentSum] = useState(0);
  const [maxLen, setMaxLen] = useState(0);
  const [windowIndices, setWindowIndices] = useState([]); // For highlighting the window
  
  // Control State
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [isFinished, setIsFinished] = useState(false);
  const [activeRule, setActiveRule] = useState(null); // 'EXPAND', 'SHRINK', 'CHECK'
  const [message, setMessage] = useState("Ready to start.");
  const [stepState, setStepState] = useState('EXPAND'); // Internal sub-state for logic flow

  // Inputs
  const [inputStr, setInputStr] = useState(DEFAULT_ARRAY.join(', '));
  const [inputK, setInputK] = useState(DEFAULT_K);
  const [showSettings, setShowSettings] = useState(false);

  // Refs for intervals
  const timerRef = useRef(null);

  // --- Logic ---

  const reset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setLeft(0);
    setRight(-1); // Reset to effectively "before start"
    setCurrentSum(0);
    setMaxLen(0);
    setWindowIndices([]);
    setActiveRule(null);
    setMessage("Reset. Ready to start.");
    setStepState('EXPAND');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const applySettings = () => {
    const newArr = inputStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (newArr.length > 0) {
      setArray(newArr);
      setTargetK(inputK);
      reset();
      setShowSettings(false);
    }
  };

  // The core logic step function
  const nextStep = () => {
    if (isFinished) return;

    // We use a functional update pattern or local variables to determine next move based on current 'stepState'
    
    // 1. EXPAND PHASE
    if (stepState === 'EXPAND') {
      const nextRight = right + 1;
      
      if (nextRight >= array.length) {
        setIsFinished(true);
        setIsRunning(false);
        setActiveRule(null);
        setMessage(`Finished! Maximum length found: ${maxLen}`);
        return;
      }

      setActiveRule('EXPAND');
      setRight(nextRight);
      const newVal = array[nextRight];
      const newSum = currentSum + newVal;
      setCurrentSum(newSum);
      
      setMessage(`Rule 1: Expanding Right to index ${nextRight}. Added ${newVal}. Sum is now ${newSum}.`);
      setStepState('SHRINK_CHECK'); // Next, we check if we need to shrink
    } 
    
    // 2. CHECK IF NEEDS SHRINKING
    else if (stepState === 'SHRINK_CHECK') {
      if (currentSum > targetK) {
        setStepState('SHRINK');
        // Immediately trigger shrink logic in next tick or same tick? 
        // Let's do it in next tick for visual clarity
        setActiveRule('SHRINK');
        setMessage(`Rule 2: Sum (${currentSum}) > K (${targetK}). Need to shrink.`);
      } else {
        setStepState('CHECK_SIZE'); // No shrink needed, go to size check
        // Trigger immediately for smoothness? No, let user see the state.
        nextStepInternalDirect('CHECK_SIZE'); // Optimization: skip a wait cycle if no shrink needed
      }
    }

    // 3. SHRINK PHASE
    else if (stepState === 'SHRINK') {
      setActiveRule('SHRINK');
      const valToRemove = array[left];
      const newSum = currentSum - valToRemove;
      const newLeft = left + 1;

      setCurrentSum(newSum);
      setLeft(newLeft);
      setMessage(`Rule 2: Shrinking Left from index ${left}. Removed ${valToRemove}. Sum is now ${newSum}.`);

      if (newSum > targetK) {
        // Still too big, stay in SHRINK state
        setStepState('SHRINK');
      } else {
        // Fixed, now check size
        setStepState('CHECK_SIZE');
      }
    }

    // 4. CHECK SIZE PHASE
    else if (stepState === 'CHECK_SIZE') {
      setActiveRule('CHECK');
      if (currentSum === targetK) {
        const currentLen = right - left + 1;
        let msg = `Rule 3: Sum is exactly ${targetK}! Length is ${currentLen}.`;
        
        if (currentLen > maxLen) {
          setMaxLen(currentLen);
          msg += ` New Record! (Previous: ${maxLen})`;
        } else {
          msg += ` Not a new record (Max: ${maxLen}).`;
        }
        setMessage(msg);
      } else {
         setMessage(`Rule 3: Sum (${currentSum}) is not K (${targetK}). Moving on.`);
      }
      setStepState('EXPAND'); // Loop back to start
    }
  };

  // Helper to skip a render cycle for logic that shouldn't pause
  const nextStepInternalDirect = (forceState) => {
     // This is a bit of a hack to handle the "Check if shrink needed -> No -> Check Size" transition smoothly
     // without requiring a user click or timer tick for the "No" decision.
     if (forceState === 'CHECK_SIZE') {
        setActiveRule('CHECK');
        if (currentSum === targetK) {
             // We can't access the *updated* currentSum from the closure if we just set it in previous block without refs
             // But React state updates are batched. 
             // To simplify, we will just let the timer tick handle it, even if it adds a small delay.
             // It makes the animation easier to follow.
        }
        setStepState('CHECK_SIZE');
        // We override the message set by SHRINK_CHECK
        setMessage(`Sum (${currentSum}) <= K. Checking size...`);
     }
  };


  useEffect(() => {
    if (isRunning && !isFinished) {
      timerRef.current = setInterval(() => {
        nextStep();
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }); // Re-run effect on every render to capture latest state in closure if not using refs for state

  // Calculate window style for visual
  const getBoxStyle = (index) => {
    let style = "bg-white border-2 border-slate-200 text-slate-700";
    
    // Inside current window
    if (index >= left && index <= right) {
        style = "bg-blue-50 border-blue-400 text-blue-700 font-bold";
        if (currentSum > targetK) style = "bg-red-50 border-red-400 text-red-700";
        if (currentSum === targetK) style = "bg-green-50 border-green-500 text-green-700 shadow-md transform -translate-y-1";
    }
    
    // Ghosted out (left of window)
    if (index < left) {
        style = "bg-slate-100 border-slate-200 text-slate-300";
    }

    return style;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="max-w-4xl w-full mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Sliding Window Visualization</h1>
          <p className="text-slate-500 dark:text-slate-400">Find Max Length Subarray where Sum = K</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full hover:bg-slate-200 transition-colors"
        >
          <Settings className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-4xl w-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-6 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold mb-4 text-lg dark:text-slate-100">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Array (comma separated)</label>
              <input 
                type="text" 
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Target Sum (K)</label>
              <input 
                type="number" 
                value={inputK}
                onChange={(e) => setInputK(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={applySettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Apply & Reset
            </button>
          </div>
        </div>
      )}

      {/* Main Visualization Area */}
      <div className="max-w-6xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Status Bar */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Target (K)</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{targetK}</div>
          </div>
          <div className={`bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 ${currentSum > targetK ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' : currentSum === targetK ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800' : ''}`}>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Current Sum</div>
            <div className={`text-2xl font-bold ${currentSum > targetK ? 'text-red-600 dark:text-red-400' : currentSum === targetK ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {currentSum}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Max Length</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{maxLen}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Current Window</div>
            <div className="text-xl font-mono text-slate-700 dark:text-slate-300">
               {right < 0 ? '[-]' : `[${left}, ${right}]`}
            </div>
          </div>
        </div>

        {/* Array Display */}
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="flex justify-start min-w-max mx-auto space-x-2 md:space-x-4 pt-8 pb-4 px-2">
            {array.map((num, idx) => (
              <div key={idx} className="relative flex flex-col items-center group">
                {/* Top Indices */}
                <div className="absolute -top-8 text-xs text-slate-400 font-mono mb-2">{idx}</div>
                
                {/* Left Pointer */}
                <div 
                  className={`absolute -top-12 transition-all duration-500 ease-in-out ${left === idx ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
                >
                  <div className="flex flex-col items-center">
                     <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">L</span>
                     <ChevronRight className="w-5 h-5 text-emerald-600 rotate-90" />
                  </div>
                </div>

                {/* The Box */}
                <div 
                  className={`
                    w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl rounded-lg shadow-sm transition-all duration-300
                    ${getBoxStyle(idx)}
                  `}
                >
                  {num}
                </div>

                {/* Right Pointer */}
                <div 
                  className={`absolute -bottom-12 transition-all duration-500 ease-in-out ${right === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                >
                   <div className="flex flex-col items-center">
                     <ChevronLeft className="w-5 h-5 text-blue-600 rotate-90" />
                     <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mt-1">R</span>
                  </div>
                </div>
              </div>
            ))}
            
             {/* End marker */}
             <div className="relative flex flex-col items-center justify-center opacity-30">
                <div className="w-16 h-16 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-lg">
                    END
                </div>
             </div>

          </div>
        </div>

        {/* Dynamic Explanation & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-slate-200 dark:border-slate-700">
            
            {/* Live Log */}
            <div className="lg:col-span-2 p-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Algorithm Log</h3>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm min-h-[100px] flex items-center">
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>
            </div>

            {/* Rules Sidebar */}
            <div className="p-6 bg-white dark:bg-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Active Rules</h3>
                
                <div className={`p-3 rounded-lg text-sm transition-all duration-300 ${activeRule === 'EXPAND' ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    <div className="font-bold mb-1">Rule 1: Always Expand</div>
                    Move Right pointer. Add number to sum.
                </div>

                <div className={`p-3 rounded-lg text-sm transition-all duration-300 ${activeRule === 'SHRINK' ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-900 dark:text-red-200 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    <div className="font-bold mb-1">Rule 2: Shrink if Too Big</div>
                    If Sum {'>'} K: Subtract Left, Move Left.
                </div>

                <div className={`p-3 rounded-lg text-sm transition-all duration-300 ${activeRule === 'CHECK' ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    <div className="font-bold mb-1">Rule 3: Check Size</div>
                    If Sum == K: Update Max Length.
                </div>
            </div>
        </div>

        {/* Controls Footer */}
        <div className="bg-slate-100 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
           
           <div className="flex items-center gap-2">
               <button 
                  onClick={reset}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 shadow-sm transition-all active:scale-95"
                  title="Reset"
                >
                   <RotateCcw className="w-5 h-5" />
               </button>
               
               <button 
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-md transition-all active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
               >
                   {isRunning ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Play</>}
               </button>

               <button 
                  onClick={nextStep}
                  disabled={isRunning || isFinished}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Step Forward"
               >
                   <SkipForward className="w-5 h-5" />
               </button>
           </div>

           <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
               <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Speed:</span>
               <input 
                 type="range" 
                 min="100" 
                 max="2000" 
                 step="100"
                 value={2100 - speed} // Invert so right is faster
                 onChange={(e) => setSpeed(2100 - parseInt(e.target.value))}
                 className="w-32 accent-blue-600 cursor-pointer"
               />
               <span className="text-xs text-slate-400 font-mono w-12 text-right">{(2100 - speed)/100}x</span>
           </div>

        </div>
      </div>
    </div>
  );
};

export default SlidingWindow;