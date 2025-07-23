"use client";

import { useState, useEffect } from 'react';
import { 
  Journey, 
  UserStats, 
  ActiveTravelMode, 
  TransportMode, 
  calculateCO2Saved, 
  calculateLevel, 
  calculatePoints, 
  calculateStreak,
  formatCO2,
  getAchievements
} from '@/lib/co2-calculations';
import { loadJourneys, saveJourneys, loadStats, saveStats, exportData, importData } from '@/lib/storage';

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalCO2Saved: 0,
    totalDistance: 0,
    totalJourneys: 0,
    streakDays: 0,
    level: 1,
    points: 0,
  });

  // Form state
  const [distance, setDistance] = useState('');
  const [activeTravelMode, setActiveTravelMode] = useState<ActiveTravelMode>('walking');
  const [replacedTransportMode, setReplacedTransportMode] = useState<TransportMode>('car');
  const [duration, setDuration] = useState('');
  const [route, setRoute] = useState('');
  const [notes, setNotes] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadedJourneys = loadJourneys();
    const loadedStats = loadStats();
    setJourneys(loadedJourneys);
    setStats(loadedStats);
  }, []);

  const updateStats = (newJourneys: Journey[]) => {
    const totalCO2Saved = newJourneys.reduce((sum, journey) => sum + journey.co2Saved, 0);
    const totalDistance = newJourneys.reduce((sum, journey) => sum + journey.distance, 0);
    const totalJourneys = newJourneys.length;
    const streakDays = calculateStreak(newJourneys);
    const level = calculateLevel(totalCO2Saved);
    const points = newJourneys.reduce((sum, journey) => 
      sum + calculatePoints(journey.co2Saved, journey.distance), 0
    );

    const newStats: UserStats = {
      totalCO2Saved,
      totalDistance,
      totalJourneys,
      streakDays,
      level,
      points,
    };

    setStats(newStats);
    saveStats(newStats);
  };

  const addJourney = (e: React.FormEvent) => {
    e.preventDefault();
    
    const distanceNum = parseFloat(distance);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      alert('Please enter a valid distance');
      return;
    }

    const co2Saved = calculateCO2Saved(distanceNum, replacedTransportMode);
    
    const newJourney: Journey = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      distance: distanceNum,
      activeTravelMode,
      replacedTransportMode,
      co2Saved,
      duration: duration ? parseInt(duration) : undefined,
      route: route || undefined,
      notes: notes || undefined,
    };

    const updatedJourneys = [...journeys, newJourney];
    setJourneys(updatedJourneys);
    saveJourneys(updatedJourneys);
    updateStats(updatedJourneys);

    // Reset form
    setDistance('');
    setDuration('');
    setRoute('');
    setNotes('');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `co2-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (importData(content)) {
            const loadedJourneys = loadJourneys();
            const loadedStats = loadStats();
            setJourneys(loadedJourneys);
            setStats(loadedStats);
            alert('Data imported successfully!');
          } else {
            alert('Failed to import data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const previewCO2 = distance ? calculateCO2Saved(parseFloat(distance) || 0, replacedTransportMode) : 0;
  const previewPoints = distance ? calculatePoints(previewCO2, parseFloat(distance) || 0) : 0;
  const achievements = getAchievements(stats);
  const currentLevelProgress = ((stats.totalCO2Saved % 10000) / 10000) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 text-green-600">🌱</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Active Travel CO₂ Tracker</h1>
                <p className="text-sm text-gray-600">Track your carbon savings from walking, cycling, and active travel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={handleExport}>
                📥 Export
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleImport}>
                📤 Import
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Total CO₂ Saved</h3>
                <span className="text-green-600">🌱</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCO2(stats.totalCO2Saved)}
              </div>
              <p className="text-sm text-muted-foreground">
                Equivalent to {Math.round(stats.totalCO2Saved / 2300)} trees planted
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Level & Points</h3>
                <span>🏆</span>
              </div>
              <div className="text-2xl font-bold">Level {stats.level}</div>
              <div className="text-sm text-muted-foreground mb-2">
                {stats.points.toLocaleString()} points
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${currentLevelProgress}%` }}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCO2(10000 - (stats.totalCO2Saved % 10000))} to next level
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Streak</h3>
                <span>⚡</span>
              </div>
              <div className="text-2xl font-bold">{stats.streakDays}</div>
              <p className="text-sm text-muted-foreground">
                {stats.streakDays === 1 ? 'day' : 'days'} in a row
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Total Distance</h3>
                <span>📈</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalDistance.toFixed(1)}km</div>
              <p className="text-sm text-muted-foreground">
                {stats.totalJourneys} journeys completed
              </p>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">🎯 Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <span key={achievement} className="badge badge-outline bg-green-100 text-green-800">
                    🏆 {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Journey Form and List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Journey Form */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">➕ Log Your Journey</h2>
              <form onSubmit={addJourney} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distance (km)</label>
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="e.g., 2.5"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">How did you travel?</label>
                    <select 
                      className="select" 
                      value={activeTravelMode} 
                      onChange={(e) => setActiveTravelMode(e.target.value as ActiveTravelMode)}
                    >
                      <option value="walking">🚶 Walking</option>
                      <option value="cycling">🚴 Cycling</option>
                      <option value="wheelchair">♿ Wheelchair</option>
                      <option value="scooter">🛴 Scooter</option>
                      <option value="skateboard">🛹 Skateboard</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">What transport did you replace?</label>
                    <select 
                      className="select" 
                      value={replacedTransportMode} 
                      onChange={(e) => setReplacedTransportMode(e.target.value as TransportMode)}
                    >
                      <option value="car">🚗 Car</option>
                      <option value="bus">🚌 Bus</option>
                      <option value="train">🚆 Train</option>
                      <option value="motorcycle">🏍️ Motorcycle</option>
                      <option value="taxi">🚕 Taxi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Route (optional)</label>
                  <input
                    className="input"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="e.g., Home to City Centre"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <input
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Beautiful sunny day, felt great!"
                  />
                </div>

                {distance && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Preview:</strong> You&apos;ll save <strong>{Math.round(previewCO2)}g CO₂</strong> and earn <strong>{previewPoints} points</strong>!
                    </p>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-full">
                  Add Journey
                </button>
              </form>
            </div>

            {/* Journey List */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Recent Journeys</h2>
              {journeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No journeys logged yet. Add your first journey!
                </p>
              ) : (
                <div className="space-y-4">
                  {journeys
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((journey) => (
                      <div
                        key={journey.id}
                        className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {journey.activeTravelMode === 'walking' && '🚶'}
                              {journey.activeTravelMode === 'cycling' && '🚴'}
                              {journey.activeTravelMode === 'wheelchair' && '♿'}
                              {journey.activeTravelMode === 'scooter' && '🛴'}
                              {journey.activeTravelMode === 'skateboard' && '🛹'}
                            </span>
                            <span className="font-medium">
                              {journey.distance}km
                            </span>
                            <span className="text-muted-foreground">instead of</span>
                            <span className="text-lg">
                              {journey.replacedTransportMode === 'car' && '🚗'}
                              {journey.replacedTransportMode === 'bus' && '🚌'}
                              {journey.replacedTransportMode === 'train' && '🚆'}
                              {journey.replacedTransportMode === 'motorcycle' && '🏍️'}
                              {journey.replacedTransportMode === 'taxi' && '🚕'}
                            </span>
                          </div>
                          <span className="badge badge-outline bg-green-50 text-green-700 border-green-200">
                            {formatCO2(journey.co2Saved)} saved
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            📅 {new Date(journey.date).toLocaleDateString()}
                          </div>
                          
                          {journey.duration && (
                            <div className="flex items-center gap-1">
                              ⏱️ {journey.duration} min
                            </div>
                          )}
                          
                          {journey.route && (
                            <div className="flex items-center gap-1">
                              📍 {journey.route}
                            </div>
                          )}
                        </div>

                        {journey.notes && (
                          <div className="flex items-start gap-1 text-sm">
                            💬 <span className="text-muted-foreground">{journey.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {journeys.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Showing 10 most recent journeys out of {journeys.length} total
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              Part of the <strong>GALLANT</strong> project - Glasgow as a Living Lab Accelerating Novel Transformation
            </p>
            <p>
              University of Glasgow | Promoting active travel and climate action through community science
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <a 
                href="https://communitycollabglasgow.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                Community Collaboration Glasgow
              </a>
              <a 
                href="https://transport.gov.scot/active-travel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                Active Travel Scotland
              </a>
              <a 
                href="https://www.spotteron.com/communimap/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                CommuniMap
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
