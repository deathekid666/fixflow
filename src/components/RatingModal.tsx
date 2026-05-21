 "use client";
// src/components/RatingModal.tsx
// Shown automatically when a work order is marked DELIVERED.

import { useState } from "react";

interface Props {
  workOrderId: string;
  orderNumber: string;
  customerName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function RatingModal({
  workOrderId,
  orderNumber,
  customerName,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Veuillez sélectionner une note.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Auth is via cookie — no header needed (same pattern as your other routes)
        credentials: "include",
        body: JSON.stringify({ workOrderId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la soumission");
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-800">Merci !</h2>
            <p className="text-gray-500 text-sm">
              La note a été enregistrée pour {customerName}.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Satisfaction client
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Bon #{orderNumber} — {customerName}
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {STARS.map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span
                    className={
                      star <= (hovered || rating)
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Commentaire (optionnel)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition"
              >
                Ignorer
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Soumettre"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

