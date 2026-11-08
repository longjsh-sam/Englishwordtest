"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API는 표준 타입이 없어 필요한 부분만 정의한다.
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "마이크 권한이 거부되었어요. 브라우저 주소창 옆 자물쇠 아이콘에서 마이크를 허용해 주세요.",
  "no-speech": "목소리가 들리지 않았어요. 다시 말해 볼까요?",
  "audio-capture": "마이크를 찾을 수 없어요.",
  network: "음성 인식 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.",
};

/** 한국어 음성 인식. 확정된 문장은 onFinal로 전달하고, 인식 중인 문장은 interim으로 보여준다. */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(Boolean(getCtor()));
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);

    const recognition = new Ctor();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          onFinalRef.current(result[0].transcript.trim());
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (event.error !== "no-speech") wantListeningRef.current = false;
      setError(ERROR_MESSAGES[event.error] ?? `음성 인식 오류: ${event.error}`);
    };
    recognition.onend = () => {
      setInterim("");
      // 크롬은 침묵이 길면 자동 종료되므로, 사용자가 끄지 않았다면 다시 시작한다.
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          /* 재시작 실패 시 종료 처리 */
        }
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    wantListeningRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("음성 인식을 시작하지 못했어요.");
    }
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, interim, error, start, stop };
}

/** 피드백을 소리 내어 읽어 준다 (브라우저 TTS). */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
