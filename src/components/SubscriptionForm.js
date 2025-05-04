'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Subscription.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getUser } from '../services/api';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const userData = await getUser();
        setUser(userData);
        
        // Si l'utilisateur est déjà abonné, rediriger vers la page de gestion d'abonnement
        if (userData.isSubscribed) {
          router.push('/subscription/manage');
          return;
        }
        
        // Récupérer les plans disponibles depuis l'API
        const response = await fetch('http://localhost:3005/api/payments/plans');
        
        if (!response.ok) {
          throw new Error('Impossible de récupérer les plans');
        }
        
        const data = await response.json();
        
        // Filtrer et organiser les plans (mensuel et annuel)
        const formattedPlans = data.map(plan => ({
          ...plan,
          features: [
            'Accès illimité aux devis',
            'Assistance prioritaire',
            'Pas de publicités',
            plan.interval === 'year' ? 'Économie de 20%' : null
          ].filter(Boolean)
        }));
        
        setPlans(formattedPlans);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubscribe = async (planId) => {
    try {
      // Créer une session de paiement
      const response = await fetch('http://localhost:3005/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType: planId === plans[0]?.id ? 'MONTHLY' : 'YEARLY',
          email: user.email,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }
      
      const session = await response.json();
      
      // Rediriger vers la page de paiement Stripe
      window.location.href = session.url;
    } catch (err) {
      console.error('Erreur lors de la souscription:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Chargement des offres d&apos;abonnement...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Une erreur est survenue</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/')}>Retour à l&apos;accueil</button>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionPage}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faCrown} className={styles.crownIcon} />
        <h1>Abonnez-vous à notre service Premium</h1>
        <p>Choisissez l&apos;offre qui vous convient le mieux</p>
      </div>
      
      <div className={styles.plansContainer}>
        {plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              <div className={styles.planHeader}>
                <h2>{plan.name}</h2>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>
              
              <div className={styles.planPrice}>
                <span className={styles.amount}>{plan.amount}</span>
                <span className={styles.currency}>{plan.currency.toUpperCase()}</span>
                <span className={styles.interval}>
                  / {plan.interval === 'month' ? 'mois' : 'an'}
                </span>
              </div>
              
              <ul className={styles.features}>
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={styles.subscribeButton}
                onClick={() => handleSubscribe(plan.id)}
              >
                S&apos;abonner
              </button>
            </div>
          ))
        ) : (
          <div className={styles.noPlans}>
            <p>Aucun plan d&apos;abonnement disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
} 