import { Check, FlaskConical, Move, RotateCcw, Sparkles, Thermometer, TimerReset } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

type SimItem = 'powder' | 'weighed' | 'sandwich' | null;
type ProcessKey = 'heating' | 'cooling' | 'reheating' | null;

const guideSteps = [
  'Click the ROY powder to the analytical balance.',
  'Click the weighed ROY powders 5 mg onto the coverslips.',
  'Click the coverslip sandwich onto the Linkam stage.',
  'Heat the loaded sample and watch melting.',
  'Cool the melt and watch crystals grow.',
  'Reheat the sample and watch the phase changes.'
];

const flashMessages = [
  'ROY powder transferred to the analytical balance. The balance reads approximately 5 mg.',
  'The 5 mg ROY sample is placed between coverslips to form a sandwich sample.',
  'The sandwich sample is loaded onto the Linkam stage.',
  'Heating complete: yellow ROY has melted into a red liquid.',
  'Cooling complete: ROY molecules have organised into crystals.',
  'Reheating complete: crystals, new forms, melting, and further transformation were observed.'
];

const processNotes: Record<Exclude<ProcessKey, null>, string> = {
  heating: 'Heating disrupts the ordered crystal structure. ROY reaches its melting point and becomes a red molten liquid.',
  cooling: 'Cooling lets ROY molecules reorganise into an ordered crystal lattice. Nucleation happens first, then crystal growth spreads.',
  reheating: 'Reheating can trigger crystals → new forms → melt → new form → melt behaviour in ROY.'
};

const PICTURE_PATHS = {
  royPowder: '/crystallisation-explorer/pictures/roy-powder.png',
  weighedRoySample: '/crystallisation-explorer/pictures/weighed%20ROY%20powder.PNG',
  coverslips: '/crystallisation-explorer/pictures/CoverSlips.png',
  coverslipSandwich: '/crystallisation-explorer/pictures/coverslip-sandwich.png',
  analyticalBalance: '/crystallisation-explorer/pictures/analytical-balance.png',
  linkamHotstage: '/crystallisation-explorer/pictures/linkam-stage.png',
  sampleLoaded: '/crystallisation-explorer/pictures/sample%20loaded.png',
};

const VIDEO_PATHS = {
  heating: '/crystallisation-explorer/videos/heating.mp4?v=20250608',
  cooling: '/crystallisation-explorer/videos/cooling.mp4?v=20250608',
  reheating: '/crystallisation-explorer/videos/reheating.mp4?v=20250608',
} as const;

const PROCESS_DURATIONS = {
  heating: 14,
  cooling: 5,
  reheating: 34,
} as const;

function PictureWithFallback({
  src,
  alt,
  className,
  fallback
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [ClickItem, setClickItem] = useState<SimItem>(null);
  const [feedback, setFeedback] = useState('Click the highlighted tool to the matching instrument.');
  const [activeProcess, setActiveProcess] = useState<ProcessKey>(null);
  const [lastVideo, setLastVideo] = useState<ProcessKey>(null);
  const [countdown, setCountdown] = useState<number>(PROCESS_DURATIONS.heating);
  const [flashText, setFlashText] = useState<string | null>(null);

  const currentItem: SimItem = step === 0 ? 'powder' : step === 1 ? 'weighed' : step === 2 ? 'sandwich' : null;
  const processRunning = activeProcess !== null;
  const displayVideo = activeProcess ?? lastVideo;
  const videoSource = displayVideo ? VIDEO_PATHS[displayVideo] : null;

  useEffect(() => {
    if (!flashText) return;
    const timer = window.setTimeout(() => setFlashText(null), 10000);
    return () => window.clearTimeout(timer);
  }, [flashText]);

  useEffect(() => {
    if (!processRunning) return;

    if (countdown <= 0) {
      if (activeProcess === 'heating') {
        setStep(4);
        setFeedback('Heating complete. Now cool the red melt to form crystals.');
        setFlashText(flashMessages[3]);
      }
      if (activeProcess === 'cooling') {
        setStep(5);
        setFeedback('Cooling complete. Now reheat the sample to observe further changes.');
        setFlashText(flashMessages[4]);
      }
      if (activeProcess === 'reheating') {
        setStep(6);
        setFeedback('Reheating complete. ROY showed crystals, new forms, melting, and further transformation.');
        setFlashText(flashMessages[5]);
      }
      setActiveProcess(null);
      return;
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [processRunning, countdown, activeProcess]);

  const statusTitle = useMemo(() => {
    if (activeProcess === 'heating') return 'Heating: melting in progress';
    if (activeProcess === 'cooling') return 'Cooling: crystal growth in progress';
    if (activeProcess === 'reheating') return 'Reheating: phase change in progress';
    if (step >= 6) return 'Reheating complete';
    if (step >= 5) return 'Crystals formed';
    if (step === 4) return 'Red melt ready to cool';
    if (step === 3) return 'Sample loaded';
    return 'Build the crystal experiment';
  }, [activeProcess, step]);

  const toolHeading = step === 0
    ? 'Click to the balance'
    : step === 1
      ? 'Click onto coverslips'
      : step === 2
        ? 'Click to the Linkam stage'
        : 'Run heating and cooling';

  const scienceText = activeProcess
    ? processNotes[activeProcess]
    : step >= 5
      ? 'ROY crystallisation shows how molecules arrange into ordered structures after cooling from the melt.'
      : step >= 4
        ? 'The sample has changed from yellow solid ROY into a red molten phase.'
        : 'ROY is polymorphic: the same molecule can form different crystal structures, colours, and morphologies.';

  function showStepMessage(index: number) {
    setFlashText(flashMessages[index]);
  }

  function resetAll() {
    setStep(0);
    setClickItem(null);
    setFeedback('Click the highlighted tool to the matching instrument.');
    setActiveProcess(null);
    setLastVideo(null);
    setCountdown(PROCESS_DURATIONS.heating);
    setFlashText(null);
  }

  function addCurrentTool(target?: 'balance' | 'coverslips' | 'stage') {
    if (step === 0 && ClickItem === 'powder' && target === 'balance') {
      setStep(1);
      setClickItem(null);
      setFeedback('Powder weighed. Now Click the weighed ROY powders 5 mg onto coverslips.');
      showStepMessage(0);
      return;
    }

    if (step === 1 && ClickItem === 'weighed' && target === 'coverslips') {
      setStep(2);
      setClickItem(null);
      setFeedback('Sandwich sample made. Now Click the sandwich sample onto the Linkam stage.');
      showStepMessage(1);
      return;
    }

    if (step === 2 && ClickItem === 'sandwich' && target === 'stage') {
      setStep(3);
      setClickItem(null);
      setFeedback('Sample loaded. Start heating to melt ROY.');
      showStepMessage(2);
      return;
    }

    setFeedback('Try the highlighted station: powder → balance, 5 mg sample → coverslips, sandwich → Linkam stage.');
  }

  function tapActiveItem() {
    if (currentItem === 'powder' && step === 0) {
      setStep(1);
      setFeedback('Powder weighed. Now Click the weighed ROY powders 5 mg onto coverslips.');
      showStepMessage(0);
      return;
    }

    if (currentItem === 'weighed' && step === 1) {
      setStep(2);
      setFeedback('Sandwich sample made. Now Click the sandwich sample onto the Linkam stage.');
      showStepMessage(1);
      return;
    }

    if (currentItem === 'sandwich' && step === 2) {
      setStep(3);
      setFeedback('Sample loaded. Start heating to melt ROY.');
      showStepMessage(2);
    }
  }

  function startProcess(process: Exclude<ProcessKey, null>) {
    if (process === 'heating' && step !== 3) return;
    if (process === 'cooling' && step !== 4) return;
    if (process === 'reheating' && step !== 5) return;

    setActiveProcess(process);
    setLastVideo(process);
    setCountdown(PROCESS_DURATIONS[process]);
    setFlashText(
      process === 'heating'
        ? 'Heating started: watch the yellow solid change into red melt.'
        : process === 'cooling'
          ? 'Cooling started: watch crystal nucleation and growth.'
          : 'Reheating started: watch crystals, new forms, melting, and transformation.'
    );
    setFeedback(
      process === 'heating'
        ? 'Heating for 14 seconds...'
        : process === 'cooling'
          ? 'Cooling for 5 seconds...'
          : 'Reheating for 34 seconds...'
    );
  }

  return (
    <main className="sim-page">
      <header className="sim-header">
        <div>
          <p className="eyebrow">Interactive crystallisation simulator</p>
          <h1>Crystallisation Explorer</h1>
        </div>

        <button type="button" className="reset-button" onClick={resetAll}>
          <RotateCcw size={24} strokeWidth={2.2} /> Reset
        </button>
      </header>

      <section className="sim-shell" aria-label="ROY crystallisation simulation">
        <aside className="toolbox panel" aria-label="Clickgable tools">
          <div className="panel-title">
            <p className="eyebrow">Tools</p>
            <h2>{toolHeading}</h2>
          </div>

          <div className="tool-list">
            <button
              type="button"
              Clickgable={currentItem === 'powder'}
              onClickStart={() => currentItem === 'powder' && setClickItem('powder')}
              onClick={() => currentItem === 'powder' && tapActiveItem()}
              className={`tool-card ${currentItem === 'powder' ? 'active' : step > 0 ? 'done' : 'locked'}`}
              aria-label="Click ROY powder to the balance"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.royPowder}
                alt="ROY powder"
                className="tool-picture"
                fallback={<span className="missing-asset">ROY powder</span>}
              />
              <Move size={18} className="Click-hint" />
            </button>

            <button
              type="button"
              Clickgable={currentItem === 'weighed'}
              onClickStart={() => currentItem === 'weighed' && setClickItem('weighed')}
              onClick={() => currentItem === 'weighed' && tapActiveItem()}
              className={`tool-card weighed-tool-card ${currentItem === 'weighed' ? 'active' : step > 1 ? 'done' : 'locked'}`}
              aria-label="Click the weighed ROY powders 5 mg onto coverslips"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.weighedRoySample}
                alt="Weighed ROY powders 5 mg on coverslips"
                className="tool-picture weighed-tool-picture"
                fallback={<span className="missing-asset">weighed ROY powders 5 mg</span>}
              />
              <Move size={18} className="Click-hint" />
            </button>

            <button
              type="button"
              Clickgable={currentItem === 'sandwich'}
              onClickStart={() => currentItem === 'sandwich' && setClickItem('sandwich')}
              onClick={() => currentItem === 'sandwich' && tapActiveItem()}
              className={`tool-card ${currentItem === 'sandwich' ? 'active' : step > 2 ? 'done' : 'locked'}`}
              aria-label="Click the coverslip sandwich onto the Linkam stage"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.coverslipSandwich}
                alt="ROY coverslip sandwich sample"
                className="tool-picture"
                fallback={<span className="missing-asset">sandwich sample</span>}
              />
              <Move size={18} className="Click-hint" />
            </button>
          </div>

          <div className="tool-tip">
            <Sparkles size={16} /> The glowing tool is active. Click it to the highlighted station.
          </div>
        </aside>

        <section className="sim-area panel" aria-label="Main simulation area">
          <div className="sim-area-topbar">
            <div>
              <p className="eyebrow">Experiment station</p>
              <h2>{statusTitle}</h2>
            </div>
            <div className="timer-badge"><TimerReset size={16} /> {processRunning ? `${countdown}s` : step >= 5 ? '34s reheating' : step >= 4 ? '5s cooling' : '14s heating'}</div>
          </div>

          <div className="station-canvas">
            {videoSource ? (
              <div className="video-overlay" role="status" aria-label={`${displayVideo} video playing`}>
                <div className="video-overlay-header">
                  <div>
                    <strong>{displayVideo === 'heating' ? 'Heating observation' : displayVideo === 'cooling' ? 'Cooling observation' : 'Reheating observation'}</strong>
                    <span>{displayVideo === 'heating' ? 'Yellow solid → red melt' : displayVideo === 'cooling' ? 'Red melt → red crystals' : 'Crystals → new forms → melt → new form → melt'}</span>
                  </div>
                </div>

                <video
                  key={`${displayVideo}-${videoSource}`}
                  autoPlay
                  muted
                  playsInline
                  className="video-player"
                >
                  <source src={videoSource ?? undefined} type="video/mp4" />
                </video>

                <div className="video-science-card">
                  <FlaskConical size={18} />
                  <div>
                    <strong>Scientific interpretation</strong>
                    <p>{scienceText}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bench-stations">
                  <article
                    className={`bench-station ${step === 0 ? 'target' : ''} ${step > 0 ? 'complete' : ''}`}
                    onClickOver={(e) => e.preventDefault()}
                    onDrop={() => addCurrentTool('balance')}
                  >
                    <div className="station-image-frame">
                      <PictureWithFallback
                        src={PICTURE_PATHS.analyticalBalance}
                        alt="Analytical balance"
                        className="station-photo balance-photo"
                        fallback={<span className="missing-asset">Analytical balance</span>}
                      />
                      {step > 0 && <div className="station-result">Weighed ROY powders · 5 mg</div>}
                    </div>
                    <span className="station-label">1. Analytical balance</span>
                  </article>

                  <article
                    className={`bench-station ${step === 1 ? 'target' : ''} ${step > 1 ? 'complete' : ''}`}
                    onClickOver={(e) => e.preventDefault()}
                    onDrop={() => addCurrentTool('coverslips')}
                  >
                    <div className="station-image-frame">
                      <PictureWithFallback
                        src={step > 1 ? PICTURE_PATHS.coverslipSandwich : PICTURE_PATHS.coverslips}
                        alt={step > 1 ? 'ROY sandwich sample' : 'coverslips'}
                        className="station-photo coverslip-photo"
                        fallback={<span className="missing-asset">{step > 1 ? 'Sandwich sample' : 'Coverslips'}</span>}
                      />
                      {step > 1 && <div className="station-result">Sandwich sample made</div>}
                    </div>
                    <span className="station-label">2. Coverslips</span>
                  </article>

                  <article
                    className={`bench-station ${step === 2 ? 'target' : ''} ${step > 2 ? 'complete' : ''}`}
                    onClickOver={(e) => e.preventDefault()}
                    onDrop={() => addCurrentTool('stage')}
                  >
                    <div className="station-image-frame">
                      <PictureWithFallback
                        src={step > 2 ? PICTURE_PATHS.sampleLoaded : PICTURE_PATHS.linkamHotstage}
                        alt={step > 2 ? 'sample loaded on Linkam stage' : 'Linkam stage'}
                        className="station-photo linkam-photo"
                        fallback={<span className="missing-asset">{step > 2 ? 'Sample loaded' : 'Linkam stage'}</span>}
                      />
                      {step > 2 && <div className="station-result">Sample loaded</div>}
                    </div>
                    <span className="station-label">3. Linkam stage</span>
                  </article>
                </div>

                {flashText && <div className="science-popup">{flashText}</div>}
              </>
            )}
          </div>

          <div className="control-strip">
            <button type="button" disabled={step !== 3 || processRunning} onClick={() => startProcess('heating')} className="heat-button">
              <Thermometer size={17} /> Heat sample
            </button>
            <button type="button" disabled={step !== 4 || processRunning} onClick={() => startProcess('cooling')} className="cool-button">
              <Sparkles size={17} /> Cool sample
            </button>
            <button type="button" disabled={step !== 5 || processRunning} onClick={() => startProcess('reheating')} className="reheat-button">
              <Thermometer size={17} /> Reheating sample
            </button>
            <div className="feedback-bar">{feedback}</div>
          </div>
        </section>

        <aside className="guide panel" aria-label="Step guide and scientific explanation">
          <div className="panel-title">
            <p className="eyebrow">Guide</p>
            <h2>What to do</h2>
          </div>

          <ol className="step-list">
            {guideSteps.map((guideStep, index) => (
              <li key={guideStep} className={step > index ? 'complete' : step === index ? 'current' : ''}>
                <span>{step > index ? <Check size={14} /> : index + 1}</span>
                <p>{guideStep}</p>
              </li>
            ))}
          </ol>


        </aside>
      </section>

      <footer className="funding-note">
        This outreach demonstrator was developed with support from the ITSS Outreach Demonstrator Fund.
      </footer>
    </main>
  );
}
