import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen bg-corkboard flex items-center justify-center p-4">
            <div className="torn-paper max-w-md w-full p-8 relative">
                <div className="washi-tape washi-tape-top animate-shimmer"></div>
                <div className="paperclip"></div>

                <h2 className="font-serif text-3xl font-bold text-ink text-center mb-6">
                    {isLogin ? 'Welcome Back 📔' : 'Start Your Journey ✈️'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block font-handwriting text-lg text-ink mb-1">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="search-tag w-full"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block font-handwriting text-lg text-ink mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="search-tag w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-handwriting text-lg text-ink mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="search-tag w-full"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 font-handwriting text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-cork text-white font-handwriting 
                                 text-xl rounded-md shadow-md hover:bg-cork-dark transition-colors mt-6"
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-handwriting text-ink hover:text-cork transition-colors text-lg underline"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}
