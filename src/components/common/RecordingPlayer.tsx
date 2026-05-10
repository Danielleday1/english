import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { getAudioBlob } from "../../storage/indexedDb";

interface RecordingPlayerProps {
  recordingId?: string;
}

export function RecordingPlayer({ recordingId }: RecordingPlayerProps) {
  const { data } = useAppContext();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recording = data.recordings.find((item) => item.id === recordingId);

  useEffect(() => {
    let active = true;
    let nextUrl: string | null = null;

    async function loadAudio() {
      if (!recording) {
        setAudioUrl(null);
        return;
      }

      const blob = await getAudioBlob(recording.blobKey);
      if (!blob || !active) {
        return;
      }

      nextUrl = URL.createObjectURL(blob);
      setAudioUrl(nextUrl);
    }

    void loadAudio();

    return () => {
      active = false;
      if (nextUrl) {
        URL.revokeObjectURL(nextUrl);
      }
    };
  }, [recording]);

  if (!recording || !audioUrl) {
    return <p className="text-sm text-slate-400">还没有录音。先说满 60 秒，不需要完美。</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <PlayCircle className="h-4 w-4" />
        录音 {recording.duration} 秒
      </div>
      <audio controls src={audioUrl} className="w-full" />
    </div>
  );
}
