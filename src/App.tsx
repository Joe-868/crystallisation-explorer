import { Check, FlaskConical, MousePointerClick, RotateCcw, Sparkles, Thermometer, TimerReset } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

type SimItem = 'powder' | 'weighed' | 'sandwich' | null;
type ProcessKey = 'heating' | 'cooling' | 'reheating' | null;

const BASE = import.meta.env.BASE_URL;

const guideSteps = [
  'Click the glowing ROY powder to weigh about 5 mg on the analytical balance.',
  'Click the weighed powder to sandwich it between two glass coverslips.',
  'Click the coverslip sandwich to load it onto the Linkam hot-stage.',
  'Heat the sample and watch the yellow solid melt into a red liquid.',
  'Cool the melt and watch crystals nucleate and grow.',
  'Reheat the sample and watch the crystal forms transform.'
];

const flashMessages = [
  'ROY powder transferred to the analytical balance. The balance reads about 5 mg.',
  'The 5 mg ROY sample is sandwiched between two coverslips.',
  'The sandwich sample is loaded onto the Linkam hot-stage.',
  'Heating complete: yellow ROY has melted into a red liquid at about 110 °C.',
  'Cooling complete: ROY molecules have organised themselves into crystals.',
  'Reheating complete: you saw crystals transform into new forms, melt, and transform again!'
];

const processNotes: Record<Exclude<ProcessKey, null>, string> = {
  heating: 'Heating gives the molecules more energy until the ordered crystal structure breaks down. ROY melts at about 110 °C into a red liquid.',
  cooling: 'Cooling lets ROY molecules reorganise into an ordered crystal lattice. A few molecules cluster together first (nucleation), then crystal growth spreads outwards.',
  reheating: 'ROY is polymorphic: on reheating, one crystal form can melt or transform into another more stable form — crystals → new forms → melt → new form → melt.'
};

const PICTURE_PATHS = {
  royPowder: `${BASE}pictures/roy-powder.png`,
  weighedRoySample: `${BASE}pictures/weighed%20ROY%20powder.PNG`,
  coverslips: `${BASE}pictures/CoverSlips.png`,
  coverslipSandwich: `${BASE}pictures/coverslip-sandwich.png`,
  analyticalBalance: `${BASE}pictures/analytical-balance.png`,
  linkamHotstage: `${BASE}pictures/linkam-stage.png`,
  sampleLoaded: `${BASE}pictures/sample%20loaded.png`,
};

const VIDEO_PATHS = {
  heating: `${BASE}videos/heating.mp4?v=20260611`,
  cooling: `${BASE}videos/cooling.mp4?v=20260611`,
  reheating: `${BASE}videos/reheating.mp4?v=20260611`,
} as const;

// Actual video lengths in seconds (measured with ffprobe). Step completion is
// driven by the video's onEnded event, so these are only used for: the initial
// countdown value, the "Next: …" hints, and the timer fallback if a video
// fails to load. Keep them in sync if the videos are ever re-edited.
const PROCESS_DURATIONS = {
  heating: 19,
  cooling: 5,
  reheating: 76,
} as const;

// Real Linkam programme: 30 °C/min ramps. Heating 30→130 °C, cooling 130→45 °C,
// reheating 30→130 °C. NOTE: the videos are edited/condensed, so the readout is
// linearly interpolated across playback — endpoints are exact, the middle is
// approximate (hence the "≈" and the on-screen note).
const TEMP_PROFILES = {
  heating: { from: 30, to: 130 },
  cooling: { from: 130, to: 45 },
  reheating: { from: 30, to: 130 },
} as const;

const RAMP_RATE = 30; // °C per minute, both heating and cooling

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
  const [feedback, setFeedback] = useState('Click the glowing tool to carry out the highlighted step.');
  const [activeProcess, setActiveProcess] = useState<ProcessKey>(null);
  const [lastVideo, setLastVideo] = useState<ProcessKey>(null);
  const [countdown, setCountdown] = useState<number>(PROCESS_DURATIONS.heating);
  const [progress, setProgress] = useState(0); // 0–1, drives the temperature readout
  const [videoFailed, setVideoFailed] = useState(false);
  const [flashText, setFlashText] = useState<string | null>(null);
  const [preloadedVideos, setPreloadedVideos] = useState<Partial<Record<Exclude<ProcessKey, null>, string>>>({});
  const [preloadSettled, setPreloadSettled] = useState(0);

  // Preload all three videos in the background while pupils do the prep steps,
  // so playback starts instantly even on slow venue wifi.
  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    (Object.entries(VIDEO_PATHS) as [Exclude<ProcessKey, null>, string][]).forEach(([processKey, path]) => {
      fetch(path)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          if (cancelled) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          setPreloadedVideos((previous) => ({ ...previous, [processKey]: objectUrl }));
          setPreloadSettled((count) => count + 1);
        })
        .catch(() => {
          // Preload failed — the <video> will stream from the network as before.
          if (!cancelled) setPreloadSettled((count) => count + 1);
        });
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, []);

  const currentItem: SimItem = step === 0 ? 'powder' : step === 1 ? 'weighed' : step === 2 ? 'sandwich' : null;
  const processRunning = activeProcess !== null;
  const displayVideo = activeProcess ?? lastVideo;
  const videoSource = displayVideo ? (preloadedVideos[displayVideo] ?? VIDEO_PATHS[displayVideo]) : null;

  // Live temperature readout, interpolated across the running process
  const currentTemp = useMemo(() => {
    if (!activeProcess) return null;
    const { from, to } = TEMP_PROFILES[activeProcess];
    return Math.round(from + (to - from) * Math.min(1, Math.max(0, progress)));
  }, [activeProcess, progress]);

  useEffect(() => {
    if (!flashText) return;
    const timer = window.setTimeout(() => setFlashText(null), 10000);
    return () => window.clearTimeout(timer);
  }, [flashText]);

  function finishProcess(process: Exclude<ProcessKey, null>) {
    if (process === 'heating') {
      setStep(4);
      setFeedback('Heating complete. Now cool the red melt to form crystals.');
      setFlashText(flashMessages[3]);
    }
    if (process === 'cooling') {
      setStep(5);
      setFeedback('Cooling complete. Now reheat the sample to observe further changes.');
      setFlashText(flashMessages[4]);
    }
    if (process === 'reheating') {
      setStep(6);
      setFeedback('Reheating complete. You have seen the full ROY polymorphism cycle!');
      setFlashText(flashMessages[5]);
    }
    setProgress(1);
    setActiveProcess(null);
  }

  // Fallback only: if the video fails to load, fall back to a fixed-duration
  // countdown so the experiment never gets stuck. When the video plays
  // normally, onTimeUpdate/onEnded drive everything instead.
  useEffect(() => {
    if (!processRunning || !videoFailed || !activeProcess) return;

    if (countdown <= 0) {
      finishProcess(activeProcess);
      return;
    }

    const total = PROCESS_DURATIONS[activeProcess];
    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
      setProgress((total - (countdown - 1)) / total);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [processRunning, videoFailed, countdown, activeProcess]);

  const statusTitle = useMemo(() => {
    if (activeProcess === 'heating') return 'Heating: melting in progress';
    if (activeProcess === 'cooling') return 'Cooling: crystal growth in progress';
    if (activeProcess === 'reheating') return 'Reheating: phase changes in progress';
    if (step >= 6) return 'Experiment complete — well done!';
    if (step >= 5) return 'Crystals formed';
    if (step === 4) return 'Red melt ready to cool';
    if (step === 3) return 'Sample loaded';
    return 'Build the crystal experiment';
  }, [activeProcess, step]);

  const toolHeading = step === 0
    ? 'Weigh the powder'
    : step === 1
      ? 'Make the sandwich'
      : step === 2
        ? 'Load the hot-stage'
        : 'Run heating and cooling';

  const scienceText = activeProcess
    ? processNotes[activeProcess]
    : step >= 5
      ? 'ROY crystallisation shows how molecules arrange into ordered structures after cooling from the melt.'
      : step >= 4
        ? 'The sample has changed from yellow solid ROY into a red molten phase.'
        : 'ROY is polymorphic: the same molecule can form different crystal structures, colours, and shapes.';

  const timerBadge = processRunning
    ? `${countdown}s left`
    : step >= 6
      ? 'Complete'
      : step === 5
        ? `Next: reheat (${PROCESS_DURATIONS.reheating} s)`
        : step === 4
          ? `Next: cool (${PROCESS_DURATIONS.cooling} s)`
          : step === 3
            ? `Next: heat (${PROCESS_DURATIONS.heating} s)`
            : 'Set up the sample';

  function resetAll() {
    setStep(0);
    setFeedback('Click the glowing tool to carry out the highlighted step.');
    setActiveProcess(null);
    setLastVideo(null);
    setCountdown(PROCESS_DURATIONS.heating);
    setProgress(0);
    setVideoFailed(false);
    setFlashText(null);
  }

  function tapActiveItem() {
    if (currentItem === 'powder' && step === 0) {
      setStep(1);
      setFeedback('Powder weighed. Now click the weighed 5 mg sample to place it between coverslips.');
      setFlashText(flashMessages[0]);
      return;
    }

    if (currentItem === 'weighed' && step === 1) {
      setStep(2);
      setFeedback('Sandwich sample made. Now click the sandwich to load it onto the Linkam hot-stage.');
      setFlashText(flashMessages[1]);
      return;
    }

    if (currentItem === 'sandwich' && step === 2) {
      setStep(3);
      setFeedback('Sample loaded. Press "Heat sample" to melt the ROY.');
      setFlashText(flashMessages[2]);
    }
  }

  function startProcess(process: Exclude<ProcessKey, null>) {
    if (process === 'heating' && step !== 3) return;
    if (process === 'cooling' && step !== 4) return;
    if (process === 'reheating' && step !== 5) return;

    setActiveProcess(process);
    setLastVideo(process);
    setCountdown(PROCESS_DURATIONS[process]);
    setProgress(0);
    setVideoFailed(false);
    setFlashText(
      process === 'heating'
        ? 'Heating started: watch the yellow solid change into a red melt.'
        : process === 'cooling'
          ? 'Cooling started: watch crystal nucleation and growth.'
          : 'Reheating started: watch crystals transform, melt, and transform again.'
    );
    setFeedback(
      process === 'heating'
        ? `Heating for about ${PROCESS_DURATIONS.heating} seconds…`
        : process === 'cooling'
          ? `Cooling for about ${PROCESS_DURATIONS.cooling} seconds…`
          : `Reheating for about ${PROCESS_DURATIONS.reheating} seconds…`
    );
  }

  return (
    <main className="sim-page">
      <header className="sim-header">
        <div>
          <p className="eyebrow">Interactive crystallisation simulator</p>
          <h1>Crystallisation Explorer</h1>
          <p className="header-subtitle">ROY = Red, Orange &amp; Yellow — one molecule, many crystal colours</p>
        </div>

        <button type="button" className="reset-button" onClick={resetAll}>
          <RotateCcw size={24} strokeWidth={2.2} /> Reset
        </button>
      </header>

      <section className="sim-shell" aria-label="ROY crystallisation simulation">
        <aside className="toolbox panel" aria-label="Sample preparation tools">
          <div className="panel-title">
            <p className="eyebrow">Tools</p>
            <h2>{toolHeading}</h2>
          </div>

          <div className="tool-list">
            <button
              type="button"
              disabled={currentItem !== 'powder'}
              onClick={tapActiveItem}
              className={`tool-card ${currentItem === 'powder' ? 'active' : step > 0 ? 'done' : 'locked'}`}
              aria-label="Weigh the ROY powder on the analytical balance"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.royPowder}
                alt="ROY powder"
                className="tool-picture"
                fallback={<span className="missing-asset">ROY powder</span>}
              />
              <MousePointerClick size={18} className="Click-hint" />
            </button>

            <button
              type="button"
              disabled={currentItem !== 'weighed'}
              onClick={tapActiveItem}
              className={`tool-card weighed-tool-card ${currentItem === 'weighed' ? 'active' : step > 1 ? 'done' : 'locked'}`}
              aria-label="Place the weighed 5 mg ROY sample between coverslips"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.weighedRoySample}
                alt="Weighed 5 mg ROY sample on a coverslip"
                className="tool-picture weighed-tool-picture"
                fallback={<span className="missing-asset">weighed ROY powder, 5 mg</span>}
              />
              <MousePointerClick size={18} className="Click-hint" />
            </button>

            <button
              type="button"
              disabled={currentItem !== 'sandwich'}
              onClick={tapActiveItem}
              className={`tool-card ${currentItem === 'sandwich' ? 'active' : step > 2 ? 'done' : 'locked'}`}
              aria-label="Load the coverslip sandwich onto the Linkam hot-stage"
            >
              <PictureWithFallback
                src={PICTURE_PATHS.coverslipSandwich}
                alt="ROY coverslip sandwich sample"
                className="tool-picture"
                fallback={<span className="missing-asset">sandwich sample</span>}
              />
              <MousePointerClick size={18} className="Click-hint" />
            </button>
          </div>

          <div className="tool-tip">
            <Sparkles size={16} /> The glowing tool is the next step. Click it to move the experiment on.
          </div>
        </aside>

        <section className="sim-area panel" aria-label="Main simulation area">
          <div className="sim-area-topbar">
            <div>
              <p className="eyebrow">Experiment station</p>
              <h2>{statusTitle}</h2>
            </div>
            <div className="badge-group">
              {preloadSettled < Object.keys(VIDEO_PATHS).length && (
                <div className="preload-badge" role="status">
                  Loading videos… {preloadSettled}/{Object.keys(VIDEO_PATHS).length}
                </div>
              )}
              {currentTemp !== null && (
                <div className="temp-badge" role="status" aria-label={`Stage temperature about ${currentTemp} degrees Celsius`}>
                  <Thermometer size={16} /> ≈ {currentTemp} °C
                </div>
              )}
              <div className="timer-badge"><TimerReset size={16} /> {timerBadge}</div>
            </div>
          </div>

          <div className="station-canvas">
            {videoSource ? (
              <div className="video-overlay" role="status" aria-label={`${displayVideo} video playing`}>
                <div className="video-overlay-header">
                  <div>
                    <strong>{displayVideo === 'heating' ? 'Heating observation' : displayVideo === 'cooling' ? 'Cooling observation' : 'Reheating observation'}</strong>
                    <span>{displayVideo === 'heating' ? 'Yellow solid → red melt' : displayVideo === 'cooling' ? 'Red melt → red crystals' : 'Crystals → new forms → melt → new form → melt'}</span>
                    <span className="ramp-note">
                      {displayVideo && `${TEMP_PROFILES[displayVideo].from} → ${TEMP_PROFILES[displayVideo].to} °C at ${RAMP_RATE} °C/min — footage condensed, temperature approximate`}
                    </span>
                  </div>
                </div>

                {videoFailed ? (
                  <div className="video-fallback" role="alert">
                    <FlaskConical size={22} />
                    <p>
                      The microscopy video couldn't load, so the experiment is running on a
                      timer instead — {processRunning ? `${countdown}s remaining.` : 'this stage has finished.'}
                    </p>
                  </div>
                ) : (
                  <video
                    key={displayVideo ?? 'none'}
                    autoPlay
                    muted
                    playsInline
                    controls
                    className="video-player"
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (!processRunning || !Number.isFinite(v.duration) || v.duration <= 0) return;
                      setCountdown(Math.max(0, Math.ceil(v.duration - v.currentTime)));
                      setProgress(v.currentTime / v.duration);
                    }}
                    onEnded={() => {
                      if (activeProcess) finishProcess(activeProcess);
                    }}
                    onError={() => setVideoFailed(true)}
                  >
                    <source src={videoSource ?? undefined} type="video/mp4" onError={() => setVideoFailed(true)} />
                  </video>
                )}

                <div className="video-science-card">
                  <FlaskConical size={18} />
                  <div>
                    <strong>Scientific interpretation</strong>
                    <p>{scienceText}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bench-stations">
                <article className={`bench-station ${step === 0 ? 'target' : ''} ${step > 0 ? 'complete' : ''}`}>
                  <div className="station-image-frame">
                    <PictureWithFallback
                      src={PICTURE_PATHS.analyticalBalance}
                      alt="Analytical balance"
                      className="station-photo balance-photo"
                      fallback={<span className="missing-asset">Analytical balance</span>}
                    />
                    {step > 0 && <div className="station-result">Weighed ROY powder · 5 mg</div>}
                  </div>
                  <span className="station-label">1. Analytical balance</span>
                </article>

                <article className={`bench-station ${step === 1 ? 'target' : ''} ${step > 1 ? 'complete' : ''}`}>
                  <div className="station-image-frame">
                    <PictureWithFallback
                      src={step > 1 ? PICTURE_PATHS.coverslipSandwich : PICTURE_PATHS.coverslips}
                      alt={step > 1 ? 'ROY sandwich sample' : 'Glass coverslips'}
                      className="station-photo coverslip-photo"
                      fallback={<span className="missing-asset">{step > 1 ? 'Sandwich sample' : 'Coverslips'}</span>}
                    />
                    {step > 1 && <div className="station-result">Sandwich sample made</div>}
                  </div>
                  <span className="station-label">2. Coverslips</span>
                </article>

                <article className={`bench-station ${step === 2 ? 'target' : ''} ${step > 2 ? 'complete' : ''}`}>
                  <div className="station-image-frame">
                    <PictureWithFallback
                      src={step > 2 ? PICTURE_PATHS.sampleLoaded : PICTURE_PATHS.linkamHotstage}
                      alt={step > 2 ? 'Sample loaded on the Linkam hot-stage' : 'Linkam hot-stage'}
                      className="station-photo linkam-photo"
                      fallback={<span className="missing-asset">{step > 2 ? 'Sample loaded' : 'Linkam stage'}</span>}
                    />
                    {step > 2 && <div className="station-result">Sample loaded</div>}
                  </div>
                  <span className="station-label">3. Linkam hot-stage</span>
                </article>
              </div>
            )}

            {flashText && <div className="science-popup">{flashText}</div>}
          </div>

          <div className="control-strip">
            <button type="button" disabled={step !== 3 || processRunning} onClick={() => startProcess('heating')} className="heat-button">
              <Thermometer size={17} /> Heat sample
            </button>
            <button type="button" disabled={step !== 4 || processRunning} onClick={() => startProcess('cooling')} className="cool-button">
              <Sparkles size={17} /> Cool sample
            </button>
            <button type="button" disabled={step !== 5 || processRunning} onClick={() => startProcess('reheating')} className="reheat-button">
              <Thermometer size={17} /> Reheat sample
            </button>
            <div className="feedback-bar" role="status" aria-live="polite">{feedback}</div>
          </div>
        </section>

        <aside className="guide panel" aria-label="Step guide">
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
