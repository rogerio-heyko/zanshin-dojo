const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiService = {
    async getScores(belt = null, limit = 20) {
        try {
            const url = belt 
                ? `${API_URL}/api/scores?belt=${belt}&limit=${limit}`
                : `${API_URL}/api/scores?limit=${limit}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch scores');
            return await response.json();
        } catch (err) {
            console.warn('[API] Scores indisponíveis:', err.message);
            return [];
        }
    },

    async submitScore(playerName, score, belt) {
        try {
            const response = await fetch(`${API_URL}/api/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_name: playerName, score, belt })
            });
            if (!response.ok) throw new Error('Failed to submit score');
            return await response.json();
        } catch (err) {
            console.warn('[API] Erro ao enviar score:', err.message);
            return null;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_URL}/api/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
};