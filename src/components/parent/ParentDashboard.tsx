import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, getLevel } from '../../store/gameStore'
import { ALL_MODULES } from '../../services/curriculum'

const PIN_LENGTH = 4

export default function ParentDashboard() {
  const {
    xp,
    completedLessons,
    struggledLessons,
    currentStreak,
    coupons,
    parentPin,
    setScreen,
    setParentPin,
    markCouponPaid,
    resetProgress,
  } = useGameStore()

  const [pinInput, setPinInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [isSettingPin, setIsSettingPin] = useState(!parentPin)
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [showReset, setShowReset] = useState(false)

  const { current: lvl } = getLevel(xp)
  const pendingCoupons = coupons.filter((c) => !c.paidOut)
  const paidCoupons = coupons.filter((c) => c.paidOut)

  const totalLessons = ALL_MODULES.reduce(
    (sum, m) => sum + m.chapters.reduce((s, c) => s + c.lessons.length, 0),
    0
  )
  const completedCount = Object.keys(completedLessons).length

  function handlePinEntry(digit: string) {
    if (pinInput.length >= PIN_LENGTH) return
    const newPin = pinInput + digit
    setPinInput(newPin)

    if (newPin.length === PIN_LENGTH) {
      if (isSettingPin) {
        if (!confirmPin) {
          setConfirmPin(newPin)
          setPinInput('')
        } else if (confirmPin === newPin) {
          setParentPin(newPin)
          setAuthenticated(true)
          setIsSettingPin(false)
          setPinError('')
        } else {
          setPinError('PINs don\'t match. Try again.')
          setPinInput('')
          setConfirmPin('')
        }
      } else {
        if (newPin === parentPin) {
          setAuthenticated(true)
          setPinError('')
        } else {
          setPinError('Wrong PIN. Try again.')
          setPinInput('')
        }
      }
    }
  }

  function handleBackspace() {
    setPinInput((p) => p.slice(0, -1))
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <button className="text-slate-400 hover:text-white text-lg" onClick={() => setScreen('map')}>
            ← Back
          </button>
          <h2 className="text-white font-bold text-lg ml-2">Parent Dashboard</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div className="text-5xl">🔒</div>
          <p className="text-white font-bold text-xl text-center">
            {isSettingPin
              ? confirmPin
                ? 'Confirm your PIN'
                : 'Set a Parent PIN'
              : 'Enter Parent PIN'}
          </p>
          <p className="text-slate-400 text-sm text-center">
            {isSettingPin && !confirmPin
              ? 'Choose a 4-digit PIN to protect the parent area.'
              : isSettingPin && confirmPin
              ? 'Enter the same PIN again to confirm.'
              : 'Enter your 4-digit PIN.'}
          </p>

          {/* PIN dots */}
          <div className="flex gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all
                  ${i < pinInput.length ? 'bg-blue-400 border-blue-400' : 'bg-transparent border-slate-500'}`}
              />
            ))}
          </div>

          {pinError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm"
            >
              {pinError}
            </motion.p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => (
              <button
                key={idx}
                className={`py-4 rounded-xl text-white text-xl font-bold transition-all
                  ${key === '' ? 'invisible' : 'bg-slate-700 hover:bg-slate-600 active:scale-95'}`}
                onClick={() => key === '⌫' ? handleBackspace() : key && handlePinEntry(key)}
                disabled={key === ''}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-white text-lg" onClick={() => setScreen('map')}>
            ← Back
          </button>
          <h2 className="text-white font-bold text-lg ml-2">Parent Dashboard 👨‍👩‍👦</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* Progress Summary */}
        <div className="card p-4 space-y-2">
          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">Jay's Progress</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-amber-400 font-bold text-2xl">{xp}</p>
              <p className="text-slate-400 text-xs">Total XP</p>
            </div>
            <div>
              <p className="text-blue-400 font-bold text-2xl">{completedCount}</p>
              <p className="text-slate-400 text-xs">Lessons done</p>
            </div>
            <div>
              <p className="text-green-400 font-bold text-2xl">{currentStreak}</p>
              <p className="text-slate-400 text-xs">Day streak 🔥</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl">{lvl.icon}</span>
            <span className="text-white font-semibold">{lvl.name}</span>
            <span className="text-slate-400 text-sm ml-auto">{completedCount}/{totalLessons} lessons</span>
          </div>
        </div>

        {/* Topics to Review */}
        {struggledLessons.length > 0 && (
          <div className="card p-4 bg-orange-900/20 border border-orange-700/50">
            <h3 className="text-orange-300 font-semibold text-sm uppercase tracking-wide mb-2">
              📝 Needs Review ({struggledLessons.length})
            </h3>
            <p className="text-slate-400 text-sm">
              Jay scored under 50% on these lessons. Encourage a retry!
            </p>
          </div>
        )}

        {/* Pocket Money Coupons */}
        <div className="card p-4">
          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide mb-3">
            🎟️ Pocket Money Coupons
          </h3>

          {pendingCoupons.length === 0 && (
            <p className="text-slate-500 text-sm">
              No pending coupons. Jay earns one every 5 lessons!
            </p>
          )}

          {pendingCoupons.map((coupon) => (
            <motion.div
              key={coupon.id}
              layout
              className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-700/50 rounded-xl mb-2"
            >
              <div className="flex-1">
                <p className="text-amber-300 font-semibold text-sm">{coupon.description}</p>
                <p className="text-slate-500 text-xs">
                  Earned: {new Date(coupon.earnedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0"
                onClick={() => markCouponPaid(coupon.id)}
              >
                ✅ Paid Out
              </button>
            </motion.div>
          ))}

          {paidCoupons.length > 0 && (
            <details className="mt-2">
              <summary className="text-slate-500 text-sm cursor-pointer">
                {paidCoupons.length} paid out coupon{paidCoupons.length > 1 ? 's' : ''}
              </summary>
              {paidCoupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center gap-2 p-2 opacity-50 mt-1">
                  <span className="text-slate-500 text-xs line-through flex-1">{coupon.description}</span>
                  <span className="text-green-600 text-xs">✓ Paid {coupon.paidOutAt ? new Date(coupon.paidOutAt).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </details>
          )}
        </div>

        {/* Danger zone */}
        <div className="card p-4 bg-red-900/10 border border-red-900/30">
          <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide mb-2">⚠️ Danger Zone</h3>
          {!showReset ? (
            <button
              className="text-red-400 hover:text-red-300 text-sm underline"
              onClick={() => setShowReset(true)}
            >
              Reset all progress...
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-300 text-sm">This will erase ALL of Jay's XP, lessons, and coupons. Are you sure?</p>
              <div className="flex gap-2">
                <button
                  className="btn-danger text-sm py-2 px-4"
                  onClick={() => { resetProgress(); setShowReset(false) }}
                >
                  Yes, reset everything
                </button>
                <button
                  className="btn-secondary text-sm py-2 px-4"
                  onClick={() => setShowReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
