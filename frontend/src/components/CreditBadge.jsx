import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useAuth } from '../context/authContext';
import { Link } from 'react-router-dom';

const CreditBadge = () => {
  const { credits } = useAuth();
  const controls = useAnimation();
  const prevCredits = useRef(credits);

  // Pulse animation whenever credits change
  useEffect(() => {
    if (prevCredits.current !== credits) {
      controls.start({
        scale: [1, 1.25, 1],
        transition: { duration: 0.35, ease: 'easeInOut' },
      });
      prevCredits.current = credits;
    }
  }, [credits, controls]);

  return (
    <Link to="/account" title="View your wallet">
      <motion.div
        animate={controls}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer select-none"
      >
        {/* Coin icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-amber-500"
        >
          <circle cx="12" cy="12" r="10" className="text-amber-400" fill="currentColor" opacity="0.3" />
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.75 6.75a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.201l-.33-.149a1.836 1.836 0 01-.53-.357.75.75 0 00-1.06 1.06c.33.33.717.594 1.14.777l.78.35v.769a.75.75 0 001.5 0v-.816a3.836 3.836 0 001.72-.756c.712-.566 1.112-1.35 1.112-2.178 0-.829-.4-1.612-1.113-2.178a3.836 3.836 0 00-1.719-.756V9.75l.33.149c.194.087.373.213.53.357a.75.75 0 001.06-1.06 3.336 3.336 0 00-1.14-.777l-.78-.35V7.75z"
            clipRule="evenodd"
            fill="#d97706"
          />
        </svg>
        <span className="text-sm font-bold text-amber-700 tabular-nums">{credits}</span>
      </motion.div>
    </Link>
  );
};

export default CreditBadge;
