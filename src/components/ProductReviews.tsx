import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'products', productId, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `products/${productId}/reviews`);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products', productId, 'reviews'), {
        userId: user.uid,
        userName: profile?.displayName || 'Anonymous',
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      setComment('');
      setRating(5);
      setShowForm(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `products/${productId}/reviews`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-12 py-24 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-display uppercase tracking-tight">Technical Reviews</h3>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
            Aggregate feedback from the Aurora network.
          </p>
        </div>
        {!showForm && user && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-8 py-4 border border-white/10 text-[10px] font-mono uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Leave Feedback
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-neutral-900/50 p-8 border border-white/10 space-y-8 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Calibration:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star className={cn("w-5 h-5", star <= rating ? "text-white fill-current" : "text-neutral-800")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="OBSERVATIONS..."
                  className="w-full bg-black/50 border border-white/5 p-6 min-h-[150px] outline-none focus:border-white transition-colors font-mono text-xs text-neutral-300"
                />
                <div className="flex justify-end gap-4">
                   <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-white"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-12 py-3 bg-white text-black text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-3"
                   >
                     {isSubmitting ? 'Syncing...' : 'Transmit'} <Send className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-white/5 bg-white/[0.02]">
            <MessageSquare className="w-8 h-8 text-neutral-900 mx-auto mb-4" />
            <p className="text-[10px] font-mono text-neutral-700 uppercase tracking-widest">Awaiting first transmission.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={review.id} 
              className="p-8 border border-white/5 bg-neutral-900/30 space-y-6 hover:border-white/20 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-white/5">
                    <User className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest">{review.userName}</h4>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("w-2.5 h-2.5", i < review.rating ? "text-white fill-current" : "text-neutral-800")} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-neutral-700">
                  {review.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-light leading-relaxed italic">
                "{review.comment}"
              </p>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
