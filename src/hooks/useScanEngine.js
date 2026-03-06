import { useState, useRef, useCallback, useEffect } from "react";
import { RESCAN_INTERVAL_MS, SCAN_PHASES, THREAT_POOL } from "../data/constants";

/**
 * Custom hook encapsulating the full continuous monitoring engine:
 * sweep phases, countdown timer, cycle scheduling, and results state.
 */
export function useScanEngine({ entities, runAllFeeds, onSweepComplete }) {
  const [isMonitoring, setIsMonitoring]   = useState(false);
  const [scanCycle, setScanCycle]         = useState(0);
  const [scanPhase, setScanPhase]         = useState("");
  const [isSweeping, setIsSweeping]       = useState(false);
  const [nextScanIn, setNextScanIn]       = useState(RESCAN_INTERVAL_MS / 1000);
  const [lastScanTime, setLastScanTime]   = useState(null);
  const [results, setResults]             = useState([]);
  const [newIds, setNewIds]               = useState(new Set());

  const cycleTimerRef  = useRef(null);
  const countdownRef   = useRef(null);
  const sweepTimerRef  = useRef(null);

  /** Returns eligible threats filtered by what entities are configured. */
  const getEligibleThreats = useCallback(() => {
    return THREAT_POOL.filter((t) => {
      if (t.content.includes("{VIP}")          && !entities.vips?.length)      return false;
      if (t.content.includes("{PROJECT}")      && !entities.projects?.length)  return false;
      if (t.content.includes("{PRODUCT}")      && !entities.products?.length)  return false;
      if (t.content.includes("{KEYWORD}")      && !entities.keywords?.length)  return false;
      if (t.content.includes("{SOCIAL_HANDLE}")&& !entities.socials?.length)   return false;
      if (t.content.includes("{DOMAIN}")       && !entities.domains?.length)   return false;
      if (t.content.includes("{IP_RANGE}")     && !entities.ips?.length)       return false;
      if (t.content.includes("{CERT_DOMAIN}")  && !entities.certs?.length)     return false;
      if (t.content.includes("{SUPPLIER}")     && !entities.suppliers?.length) return false;
      return true;
    });
  }, [entities]);

  const startCountdown = useCallback(() => {
    setNextScanIn(RESCAN_INTERVAL_MS / 1000);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setNextScanIn((n) => Math.max(0, n - 1));
    }, 1000);
  }, []);

  const runSweep = useCallback(
    async (isInitial = false) => {
      setIsSweeping(true);
      const eligible = getEligibleThreats();
      const phaseList = isInitial
        ? [
            "Routing through TOR exit nodes...",
            "Querying hacker forums...",
            "Sweeping credential dump repositories...",
            "Scanning paste sites...",
            "Querying URLhaus malware feed...",
            "Checking PhishTank database...",
            "Fetching AlienVault OTX indicators...",
            "Querying HIBP breach data...",
            "Cross-referencing stealer logs...",
            "Aggregating results...",
          ]
        : SCAN_PHASES;

      // Fire real intel fetches in parallel while phases animate
      const realIntelPromise = runAllFeeds();

      let pi = 0;
      const tick = () => {
        if (pi < phaseList.length) {
          setScanPhase(phaseList[pi++]);
          sweepTimerRef.current = setTimeout(tick, isInitial ? 600 : 400);
        } else {
          realIntelPromise.then((realFindings) => {
            const count = isInitial
              ? Math.min(eligible.length, 5 + Math.floor(Math.random() * 4))
              : Math.min(eligible.length, 1 + Math.floor(Math.random() * 3));
            const shuffled = [...eligible]
              .sort(() => Math.random() - 0.5)
              .slice(0, count);
            const now = Date.now();
            const simulated = shuffled.map((t, i) => ({
              ...t,
              uid: `sim-${t.id}-${now}-${i}`,
              detectedAt: now - Math.floor(Math.random() * 3000),
              real: false,
              feedSource: "Simulated",
            }));

            const injected = [...realFindings, ...simulated];

            setResults((prev) => {
              const existingUids = new Set(prev.map((r) => r.uid));
              const fresh = injected.filter((r) => !existingUids.has(r.uid));
              if (!fresh.length) return prev;
              setNewIds((ids) => {
                const next = new Set(ids);
                fresh.forEach((r) => next.add(r.uid));
                return next;
              });
              setTimeout(() => {
                setNewIds((ids) => {
                  const next = new Set(ids);
                  fresh.forEach((r) => next.delete(r.uid));
                  return next;
                });
              }, 8000);
              return [...fresh, ...prev].slice(0, 60);
            });

            setScanCycle((c) => c + 1);
            setLastScanTime(
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            );
            setScanPhase("");
            setIsSweeping(false);
            onSweepComplete?.();
          });
        }
      };
      tick();
    },
    [getEligibleThreats, runAllFeeds, onSweepComplete]
  );

  const scheduleCycle = useCallback(() => {
    cycleTimerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      runSweep(false);
      startCountdown();
      scheduleCycle();
    }, RESCAN_INTERVAL_MS);
  }, [runSweep, startCountdown]);

  const startMonitoring = useCallback(() => {
    setResults([]);
    setNewIds(new Set());
    setIsMonitoring(true);
    runSweep(true);
    startCountdown();
    scheduleCycle();
  }, [runSweep, startCountdown, scheduleCycle]);

  const pauseMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (cycleTimerRef.current)  clearTimeout(cycleTimerRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
    if (sweepTimerRef.current)  clearTimeout(sweepTimerRef.current);
    setIsSweeping(false);
    setScanPhase("");
  }, []);

  const resetAll = useCallback(() => {
    pauseMonitoring();
    setResults([]);
    setScanCycle(0);
    setLastScanTime(null);
    setNextScanIn(RESCAN_INTERVAL_MS / 1000);
  }, [pauseMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cycleTimerRef.current)  clearTimeout(cycleTimerRef.current);
      if (countdownRef.current)   clearInterval(countdownRef.current);
      if (sweepTimerRef.current)  clearTimeout(sweepTimerRef.current);
    };
  }, []);

  return {
    isMonitoring,
    scanCycle,
    scanPhase,
    isSweeping,
    nextScanIn,
    lastScanTime,
    results,
    newIds,
    startMonitoring,
    pauseMonitoring,
    resetAll,
    setResults,
  };
}
