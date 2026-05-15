/**
 * Budget Manager - Module d'initialisation et utilitaires
 * Cœur de l'application chargé en premier
 */

const BudgetManager = (function() {
    'use strict';

    // État interne
    let currentView = 'dashboard';

    /**
     * INITIALISATION
     */

    function initApp() {
        // Vérifie si bm_settings existe, sinon crée une structure vide par défaut
        if (!getItem('bm_settings')) {
            const defaultSettings = {
                revenus: [],
                charges: []
            };
            setItem('bm_settings', defaultSettings);
        }

        // Vérifie si un mois en cours existe, sinon le crée
        const monthKey = getCurrentMonthKey();
        if (!getItem(monthKey)) {
            const defaultMonth = {
                periodes: {},
                transactions: []
            };
            setItem(monthKey, defaultMonth);
        }

        // Lance le rendu de la vue active (dashboard par défaut)
        showView('dashboard');

        console.log('Budget Manager initialisé avec succès');
    }

    /**
     * LOCALSTORAGE UTILS
     */

    function getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Erreur lors de la lecture de localStorage:', e);
            return null;
        }
    }

    function setItem(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Erreur lors de l\'écriture dans localStorage:', e);
            return false;
        }
    }

    function getCurrentMonthKey() {
        return 'bm_mois_' + new Date().toISOString().slice(0, 7);
    }

    function generateId() {
        return String(Date.now()) + Math.random().toString(36).slice(2, 7);
    }

    /**
     * CALCULS GLOBAUX
     */

    function getTotalRevenus() {
        const settings = getItem('bm_settings');
        if (!settings || !settings.revenus) return 0;
        return settings.revenus.reduce((total, revenu) => total + (parseFloat(revenu.montant) || 0), 0);
    }

    function getTotalCharges() {
        const settings = getItem('bm_settings');
        if (!settings || !settings.charges) return 0;
        return settings.charges.reduce((total, charge) => total + (parseFloat(charge.montant) || 0), 0);
    }

    function getTotalDepenses(periode) {
        const monthKey = getCurrentMonthKey();
        const monthData = getItem(monthKey);
        if (!monthData || !monthData.periodes || !monthData.periodes[periode]) return 0;
        
        const periodeData = monthData.periodes[periode];
        if (!periodeData.depenses) return 0;
        
        return periodeData.depenses.reduce((total, depense) => total + (parseFloat(depense.montant) || 0), 0);
    }

    function getSolde(periode) {
        const revenus = getTotalRevenus();
        const charges = getTotalCharges();
        const depenses = getTotalDepenses(periode);
        return revenus - charges - depenses;
    }

    function getDepensesParCategorie(periode) {
        const monthKey = getCurrentMonthKey();
        const monthData = getItem(monthKey);
        const resultats = {};

        if (!monthData || !monthData.periodes || !monthData.periodes[periode]) {
            return resultats;
        }

        const periodeData = monthData.periodes[periode];
        if (!periodeData.depenses) return resultats;

        periodeData.depenses.forEach(depense => {
            const categorie = depense.categorie || 'Non catégorisé';
            const montant = parseFloat(depense.montant) || 0;
            
            if (!resultats[categorie]) {
                resultats[categorie] = 0;
            }
            resultats[categorie] += montant;
        });

        return resultats;
    }

    /**
     * NAVIGATION
     */

    function showView(viewId) {
        // Masque toutes les sections
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Affiche la section demandée
        const targetSection = document.getElementById(viewId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Met à jour l'état actif de la navigation
        const navLinks = document.querySelectorAll('.nav-link, .menu-item, [data-view]');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const viewAttr = link.getAttribute('data-view') || link.getAttribute('href');
            if (viewAttr === '#' + viewId || viewAttr === viewId) {
                link.classList.add('active');
            }
        });

        currentView = viewId;

        // Déclenche un événement personnalisé pour le rendu de la vue
        document.dispatchEvent(new CustomEvent('viewChanged', { detail: { viewId } }));
    }

    function setupNavigationListeners() {
        // Écouter les clics sur les liens de navigation
        document.addEventListener('click', function(e) {
            const navLink = e.target.closest('[data-view], .nav-link[href^="#"]');
            if (navLink) {
                const viewId = navLink.getAttribute('data-view') || 
                              navLink.getAttribute('href').replace('#', '');
                if (viewId) {
                    e.preventDefault();
                    showView(viewId);
                }
            }
        });
    }

    /**
     * FORMAT
     */

    function formatEuro(montant) {
        const number = parseFloat(montant) || 0;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    /**
     * Initialisation automatique des écouteurs de navigation
     */
    document.addEventListener('DOMContentLoaded', setupNavigationListeners);

    // API publique
    return {
        // Initialisation
        initApp: initApp,

        // LocalStorage utils
        getItem: getItem,
        setItem: setItem,
        getCurrentMonthKey: getCurrentMonthKey,
        generateId: generateId,

        // Calculs globaux
        getTotalRevenus: getTotalRevenus,
        getTotalCharges: getTotalCharges,
        getTotalDepenses: getTotalDepenses,
        getSolde: getSolde,
        getDepensesParCategorie: getDepensesParCategorie,

        // Navigation
        showView: showView,
        setupNavigationListeners: setupNavigationListeners,

        // Format
        formatEuro: formatEuro,
        formatDate: formatDate
    };

})();

// Export pour utilisation dans d'autres modules (si besoin)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BudgetManager;
}
