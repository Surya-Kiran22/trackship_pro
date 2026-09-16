import React, { useState, useEffect } from 'react';
import { Route as RouteIcon, MapPin, Clock, ArrowRight, Zap, CheckCircle2, AlertTriangle, RefreshCw, Navigation, ShieldCheck, Compass, Layers } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function RouteAnalysisTab({ shipments = [], token, onRouteApplied }) {
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [origin, setOrigin] = useState('12/4 MG Road, Indiranagar, Bengaluru, KA 560038');
  const [destination, setDestination] = useState('45-2-1 Main Road, Surya Rao Peta, Kakinada, AP 533001');
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(null);

  // Auto-populate addresses when shipment selected
  const handleSelectShipment = (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    setApplySuccess(null);
    setError(null);

    if (!shipmentId) return;

    const shipment = shipments.find(s => String(s.id) === String(shipmentId));
    if (shipment) {
      setOrigin(shipment.pickupAddress || shipment.senderAddress || '');
      setDestination(shipment.deliveryAddress || shipment.receiverAddress || '');
    }
  };

  const handleRunAnalysis = async (e) => {
    if (e) e.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      setError('Please provide both Origin and Destination addresses for route analysis.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setApplySuccess(null);

    try {
      let result;
      if (selectedShipmentId) {
        result = await apiService.analyzeShipmentRoute(selectedShipmentId, token);
      } else {
        result = await apiService.analyzeRoute(origin.trim(), destination.trim(), token);
      }
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze route options under current traffic conditions.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRoute = async () => {
    if (!selectedShipmentId || !analysisResult || !analysisResult.selectedRoute) return;

    setApplying(true);
    setError(null);
    setApplySuccess(null);

    try {
      const selected = analysisResult.selectedRoute;
      const payload = {
        originAddress: origin,
        destinationAddress: destination,
      };

      await apiService.createRoute(selectedShipmentId, payload, token);
      setApplySuccess(`Optimal route '${selected.summary}' successfully applied to Shipment #${selectedShipmentId}!`);
      if (onRouteApplied) onRouteApplied();
    } catch (err) {
      setError(err.message || 'Failed to apply route to shipment.');
    } finally {
      setApplying(false);
    }
  };

  const selectedRoute = analysisResult?.selectedRoute;
  const alternatives = analysisResult?.alternatives || [];

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><RouteIcon size={22} color="#2563eb" /> Route Analysis & Optimization</h2>
          <p className="subtitle">Analyze live traffic conditions, compare alternative routes, and select optimal delivery paths for any shipment</p>
        </div>
      </div>

      {/* Input / Control Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleRunAnalysis}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Optional Shipment Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Select Shipment (Optional)
              </label>
              <select
                className="form-control"
                value={selectedShipmentId}
                onChange={(e) => handleSelectShipment(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
              >
                <option value="">-- Custom Route Analysis --</option>
                {shipments.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.trackingNumber} - {s.senderName} ➔ {s.receiverName} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Origin Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                <MapPin size={14} color="#16a34a" inline="true" /> Origin Address
              </label>
              <input
                type="text"
                className="form-control"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Enter pickup/origin location..."
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* Destination Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                <MapPin size={14} color="#dc2626" inline="true" /> Destination Address
              </label>
              <input
                type="text"
                className="form-control"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter delivery/destination location..."
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              {loading ? <><RefreshCw size={16} className="spin" /> Analyzing Traffic & Routes...</> : <><Zap size={16} /> Run Route Analysis</>}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {applySuccess && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{applySuccess}</span>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysisResult && selectedRoute && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Card: Selected Optimal Route */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #2563eb',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.12)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.35rem 1rem',
              borderBottomLeftRadius: '8px',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle2 size={13} /> RECOMMENDED OPTIMAL ROUTE
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={20} color="#2563eb" /> {selectedRoute.summary}
            </h3>

            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>Origin: <strong>{origin}</strong></span>
              <ArrowRight size={14} color="#94a3b8" />
              <span>Destination: <strong>{destination}</strong></span>
            </div>

            {/* Metrics KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Distance</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{selectedRoute.distanceKm} km</div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Traffic Duration</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1d4ed8' }}>{selectedRoute.trafficDurationMinutes} mins</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Standard: {selectedRoute.normalDurationMinutes} mins</div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Time Saved</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d' }}>
                  ~{Math.max(0, (alternatives.reduce((acc, a) => acc + a.trafficDurationMinutes, 0) / (alternatives.length || 1)) - selectedRoute.trafficDurationMinutes).toFixed(0)} mins
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>vs alternative routes avg</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Traffic Condition</span>
                <div>
                  <span className={`badge ${selectedRoute.trafficCondition === 'HEAVY' ? 'badge-danger' : selectedRoute.trafficCondition === 'MODERATE' ? 'badge-pending' : 'badge-delivered'}`} style={{ fontSize: '0.9rem', marginTop: '0.25rem', padding: '0.3rem 0.75rem' }}>
                    {selectedRoute.trafficCondition || 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Reason Box */}
            <div style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #2563eb', padding: '1rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', color: '#334155' }}>
              <strong>Optimization Rationale: </strong>
              <span>{analysisResult.selectionReason || 'Selected optimal route with lowest congestion and minimum travel duration.'}</span>
            </div>

            {/* Apply Route Action */}
            {selectedShipmentId && (
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleApplyRoute}
                  disabled={applying}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {applying ? <><RefreshCw size={15} className="spin" /> Applying Route...</> : <><ShieldCheck size={16} /> Apply Route to Shipment #{selectedShipmentId}</>}
                </button>
              </div>
            )}
          </div>

          {/* Alternatives Grid Section */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#475569" /> All Evaluated Route Alternatives ({alternatives.length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {alternatives.map((alt, idx) => {
                const isSelected = alt.summary === selectedRoute.summary;

                return (
                  <div
                    key={idx}
                    style={{
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                        {alt.summary}
                      </h5>
                      {isSelected ? (
                        <span style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          SELECTED
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#cbd5e1', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ALTERNATIVE
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Distance: </span>
                        <strong>{alt.distanceKm} km</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Traffic Duration: </span>
                        <strong style={{ color: isSelected ? '#1d4ed8' : '#0f172a' }}>{alt.trafficDurationMinutes} mins</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Normal Time: </span>
                        <span>{alt.normalDurationMinutes} mins</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Traffic Status: </span>
                        <span className={`badge ${alt.trafficCondition === 'HEAVY' ? 'badge-danger' : alt.trafficCondition === 'MODERATE' ? 'badge-pending' : 'badge-delivered'}`} style={{ fontSize: '0.7rem' }}>
                          {alt.trafficCondition || 'NORMAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
