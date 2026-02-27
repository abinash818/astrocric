'use client';

import { useState } from 'react';
import { rechargeWallet } from '@/lib/api';
import styles from '@/app/[locale]/dashboard/Dashboard.module.css';

export default function RechargeModal({ isOpen, onClose, token, onBalanceUpdate }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const presetAmounts = [100, 200, 500, 1000];

    const handleRecharge = async (e) => {
        if (e) e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await rechargeWallet(amount, token);
            if (response && response.success && response.redirectUrl) {
                // Redirect to PhonePe
                window.location.href = response.redirectUrl;
            } else {
                setError('Failed to initiate payment. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
            setLoading(false);
        }
    };

    const handlePresetClick = (val) => {
        setAmount(val.toString());
        setError('');
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                <h2>Recharge Astro Coins</h2>
                <p className={styles.modalSubtitle}>Select or enter amount to add to your wallet</p>

                <div className={styles.presetGrid}>
                    {presetAmounts.map((val) => (
                        <button
                            key={val}
                            className={`${styles.presetBtn} ${amount === val.toString() ? styles.active : ''}`}
                            onClick={() => handlePresetClick(val)}
                        >
                            🪙 {val}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleRecharge} className={styles.rechargeForm}>
                    <div className={styles.inputWrapper}>
                        <span className={styles.currencyIcon}>🪙</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter custom amount"
                            min="1"
                        />
                    </div>
                    {error && <p className={styles.errorText}>{error}</p>}
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Processing...' : 'Proceed to Pay'}
                    </button>
                </form>

                <p className={styles.secureText}>Powered by PhonePe • Secure Transactions</p>
            </div>
        </div>
    );
}
