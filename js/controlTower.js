/**
 * ESG Control Tower & What-If Scenario Simulator
 * Module: Main Company Admin Only
 * MEIL Centralized ESG & BRSR Reporting Platform
 */

class ControlTowerModule {
  constructor() {
    this.activeTab = 'overview'; // 'overview' | 'map' | 'hierarchy' | 'hotspots' | 'simulator' | 'sdg'
    this.selectedProjectForSim = null;
    this.simChart = null;
    this.mapInstance = null;
    this.mapLayerGroup = null;
    this.activeHotspotFilter = 'all';
    this.activeMapFilter = 'all';
  }

  // Role Gate Enforcement
  checkAccess() {
    if (!auth.isMainAdmin()) {
      ui.showToast('Access Restricted: ESG Control Tower requires Main Company Admin privileges.', 'warning');
      ui.navigateTo('dashboard');
      return false;
    }
    return true;
  }

  render(container) {
    if (!this.checkAccess()) return;

    container.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title-group">
          <div style="display:flex; align-items:center; gap:8px;">
            <h1 class="page-title">
              <i data-lucide="tower-control" style="color:var(--meil-navy);"></i>
              ESG Control Tower
            </h1>
            <span class="badge badge-primary" style="font-size:11px;">Main Company Admin Only</span>
            <span class="badge badge-approved" style="font-size:11px;"><i data-lucide="shield-check"></i> Group Oversight</span>
          </div>
          <p class="page-subtitle">Centralized enterprise decision cockpit: live multi-entity health analytics, interactive project map, deep organizational drill-down, automated hotspot risk detection, and What-If decarbonization simulator.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="controlTowerModule.refreshData()">
            <i data-lucide="refresh-cw"></i> Refresh Intelligence
          </button>
          <button class="btn btn-brand-red btn-sm" onclick="controlTowerModule.switchTab('simulator')">
            <i data-lucide="sliders"></i> Launch What-If Simulator
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-bar" style="margin-bottom:20px; display:flex; gap:8px; border-bottom:1px solid var(--border-medium); padding-bottom:4px; overflow-x:auto;">
        <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" onclick="controlTowerModule.switchTab('overview')">
          <i data-lucide="activity"></i> ESG Overview Dashboard
        </button>
        <button class="tab-btn ${this.activeTab === 'map' ? 'active' : ''}" onclick="controlTowerModule.switchTab('map')">
          <i data-lucide="map-pin"></i> Interactive Project Map
        </button>
        <button class="tab-btn ${this.activeTab === 'hierarchy' ? 'active' : ''}" onclick="controlTowerModule.switchTab('hierarchy')">
          <i data-lucide="sitemap"></i> Organizational Drill-Down
        </button>
        <button class="tab-btn ${this.activeTab === 'hotspots' ? 'active' : ''}" onclick="controlTowerModule.switchTab('hotspots')">
          <i data-lucide="alert-triangle"></i> ESG Hotspot Detection
        </button>
        <button class="tab-btn ${this.activeTab === 'simulator' ? 'active' : ''}" onclick="controlTowerModule.switchTab('simulator')">
          <i data-lucide="calculator"></i> What-If Simulator
        </button>
        <button class="tab-btn ${this.activeTab === 'sdg' ? 'active' : ''}" onclick="controlTowerModule.switchTab('sdg')">
          <i data-lucide="globe-2"></i> UN SDG &amp; Target Tracking
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="control-tower-content"></div>
    `;

    this.renderActiveTab();
    if (window.lucide) lucide.createIcons();
  }

  switchTab(tab) {
    this.activeTab = tab;
    // Destroy previous simulator chart if leaving
    if (this.simChart) {
      try { this.simChart.destroy(); } catch (e) {}
      this.simChart = null;
    }
    // Destroy previous Leaflet map if leaving
    if (this.mapInstance) {
      try { this.mapInstance.remove(); } catch (e) {}
      this.mapInstance = null;
      this.mapLayerGroup = null;
    }

    const container = document.getElementById('content-viewport');
    if (container && ui.currentView === 'control_tower') {
      this.render(container);
    }
  }

  refreshData() {
    ui.showToast('Refreshing Control Tower metrics from live store...', 'info');
    this.renderActiveTab();
    ui.showToast('Control Tower metrics up to date.', 'success');
  }

  renderActiveTab() {
    const container = document.getElementById('control-tower-content');
    if (!container) return;

    switch (this.activeTab) {
      case 'overview':
        this.renderOverviewTab(container);
        break;
      case 'map':
        this.renderMapTab(container);
        break;
      case 'hierarchy':
        this.renderHierarchyTab(container);
        break;
      case 'hotspots':
        this.renderHotspotsTab(container);
        break;
      case 'simulator':
        this.renderSimulatorTab(container);
        break;
      case 'sdg':
        this.renderSdgTab(container);
        break;
      default:
        this.renderOverviewTab(container);
    }

    if (window.lucide) lucide.createIcons();
  }

  // =========================================================================
  // CALCULATIONS & METRICS HELPERS
  // =========================================================================
  calculateOverviewMetrics() {
    const subs = store.getSubsidiaries() || [];
    const bus = store.getBusinessUnits('all') || [];
    const projs = store.getProjects('all') || [];
    const year = ui.activeYearFilter || 'FY 2025-26';
    const submissions = store.getSubmissions(year) || [];

    // Environmental emissions roll-up (from projects + verified submissions)
    let s1 = 0, s2 = 0, s3 = 0;
    let safetyIncidents = 0;
    let totalEsgScore = 0;
    let overdueCount = 0;

    projs.forEach(p => {
      const env = p.environment || {};
      const soc = p.social || {};
      s1 += Number(env.scope1 || env.ghgScope1 || 0);
      s2 += Number(env.scope2 || env.ghgScope2 || 0);
      s3 += Number(env.scope3 || env.ghgScope3 || 0);
      safetyIncidents += Number(soc.recordableIncidents || 0) + Number(soc.fatalities || 0);
      totalEsgScore += Number(p.esgCompletion || 0);

      if (p.submissionStatus === 'Correction Required' || p.submissionStatus === 'Draft') {
        overdueCount++;
      }
    });

    // Check subsidiary submissions overdue
    subs.forEach(s => {
      const subSubm = submissions.find(sm => sm.subsidiaryId === s.id);
      if (!subSubm || subSubm.status === 'Correction Required' || subSubm.status === 'Draft') {
        overdueCount++;
      }
    });

    const avgCompleteness = projs.length > 0 ? (totalEsgScore / projs.length).toFixed(1) : 85.0;
    const totalGHG = s1 + s2 + s3;

    return {
      totalSubsidiaries: subs.length,
      totalBusinessUnits: bus.length,
      totalProjects: projs.length,
      completenessPct: avgCompleteness,
      scope1: s1,
      scope2: s2,
      scope3: s3,
      totalGHG: totalGHG,
      safetyIncidents: safetyIncidents,
      overdueSubmissions: overdueCount,
      approvedProjects: projs.filter(p => p.submissionStatus === 'Approved').length,
      targetProgressPct: 76.8
    };
  }

  // =========================================================================
  // TAB 1: ESG OVERVIEW DASHBOARD
  // =========================================================================
  renderOverviewTab(container) {
    const m = this.calculateOverviewMetrics();

    container.innerHTML = `
      <!-- Governance Context Banner -->
      <div class="alert alert-info" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <i data-lucide="shield-check" style="width:20px; height:20px; color:var(--meil-navy); flex-shrink:0;"></i>
          <span><strong>Group Executive Oversight:</strong> Active reporting for <strong>${ui.activeYearFilter || 'FY 2025-26'}</strong> across <strong>${m.totalSubsidiaries} Subsidiaries</strong>, <strong>${m.totalBusinessUnits} Business Units</strong>, and <strong>${m.totalProjects} Strategic Projects</strong>.</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm btn-outline" onclick="controlTowerModule.switchTab('map')">
            <i data-lucide="map"></i> Project Map
          </button>
          <button class="btn btn-sm btn-brand-red" onclick="controlTowerModule.switchTab('hotspots')">
            <i data-lucide="alert-triangle"></i> Review Hotspots
          </button>
        </div>
      </div>

      <!-- Core KPI Cards (5 key metrics) -->
      <div class="grid-kpi-4" style="grid-template-columns: repeat(5, 1fr); margin-bottom:20px;">
        <div class="kpi-card accent-blue">
          <div class="kpi-header">
            <span class="kpi-title">Entity Footprint</span>
            <div class="kpi-icon-wrap blue"><i data-lucide="building"></i></div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${m.totalProjects}</span>
            <span class="kpi-unit">Projects</span>
          </div>
          <div class="kpi-meta">
            <span>${m.totalSubsidiaries} Subs | ${m.totalBusinessUnits} BUs</span>
            <span class="badge badge-approved">${m.approvedProjects} Approved</span>
          </div>
        </div>

        <div class="kpi-card accent-green">
          <div class="kpi-header">
            <span class="kpi-title">ESG Completeness</span>
            <div class="kpi-icon-wrap green"><i data-lucide="check-circle-2"></i></div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${m.completenessPct}%</span>
            <span class="kpi-unit">Avg Index</span>
          </div>
          <div class="kpi-meta">
            <span>SEBI Core Disclosures</span>
            <span class="kpi-trend positive"><i data-lucide="trending-up"></i> High Quality</span>
          </div>
        </div>

        <div class="kpi-card accent-red">
          <div class="kpi-header">
            <span class="kpi-title">Consolidated GHG</span>
            <div class="kpi-icon-wrap red"><i data-lucide="cloud"></i></div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${m.totalGHG.toLocaleString('en-IN')}</span>
            <span class="kpi-unit">tCO2e</span>
          </div>
          <div class="kpi-meta">
            <span>S1: ${m.scope1.toLocaleString('en-IN')} | S2: ${m.scope2.toLocaleString('en-IN')}</span>
            <span class="badge badge-info">S3: ${m.scope3.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="kpi-card accent-amber">
          <div class="kpi-header">
            <span class="kpi-title">Safety Incidents</span>
            <div class="kpi-icon-wrap amber"><i data-lucide="hard-hat"></i></div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${m.safetyIncidents}</span>
            <span class="kpi-unit">Recordable</span>
          </div>
          <div class="kpi-meta">
            <span>Zero Fatalities Recorded</span>
            <span class="kpi-trend ${m.safetyIncidents > 2 ? 'negative' : 'positive'}">LTIFR 0.04</span>
          </div>
        </div>

        <div class="kpi-card accent-purple">
          <div class="kpi-header">
            <span class="kpi-title">Target Progress</span>
            <div class="kpi-icon-wrap purple"><i data-lucide="target"></i></div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${m.targetProgressPct}%</span>
            <span class="kpi-unit">Decarbonization</span>
          </div>
          <div class="kpi-meta">
            <span>${m.overdueSubmissions} Overdue / Revision Item(s)</span>
            <span class="kpi-trend positive">On Track</span>
          </div>
        </div>
      </div>

      <!-- Middle Grid: Emissions Breakdown & Multi-Entity Performance -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
        <!-- Emissions By Scope Chart Card -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="bar-chart-2" style="color:var(--meil-navy);"></i>
              <span>Consolidated GHG Emissions by Scope (tCO2e)</span>
            </div>
            <span class="badge badge-primary">Scope 1, 2, 3</span>
          </div>
          <div class="card-body">
            <div style="height:280px; position:relative;">
              <canvas id="controlTowerGhgChart"></canvas>
            </div>
            <div style="display:flex; justify-content:space-around; margin-top:14px; padding-top:12px; border-top:1px solid var(--border-light); font-size:12px;">
              <div><strong style="color:#c8102e;">Scope 1 Direct:</strong> ${m.scope1.toLocaleString('en-IN')} tCO2e (${((m.scope1/m.totalGHG)*100).toFixed(1)}%)</div>
              <div><strong style="color:#d97706;">Scope 2 Electricity:</strong> ${m.scope2.toLocaleString('en-IN')} tCO2e (${((m.scope2/m.totalGHG)*100).toFixed(1)}%)</div>
              <div><strong style="color:#0b2545;">Scope 3 Value Chain:</strong> ${m.scope3.toLocaleString('en-IN')} tCO2e (${((m.scope3/m.totalGHG)*100).toFixed(1)}%)</div>
            </div>
          </div>
        </div>

        <!-- Target Progress & Decarbonization Roadmap -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="trending-down" style="color:var(--color-success);"></i>
              <span>Decarbonization &amp; ESG Target Tracking</span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="controlTowerModule.switchTab('sdg')">SDG Mapping &rarr;</button>
          </div>
          <div class="card-body">
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span><strong>Renewable Energy Mix (Target: 40% by FY 2027)</strong></span>
                  <strong style="color:var(--color-success);">34.8% / 40.0% (87% Achieved)</strong>
                </div>
                <div style="height:8px; border-radius:4px; background:var(--bg-surface-tertiary); overflow:hidden;">
                  <div style="height:100%; width:87%; background:var(--color-success); border-radius:4px;"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span><strong>GHG Emission Intensity Reduction (Target: -10% YoY)</strong></span>
                  <strong style="color:var(--meil-blue);">-8.4% Achieved</strong>
                </div>
                <div style="height:8px; border-radius:4px; background:var(--bg-surface-tertiary); overflow:hidden;">
                  <div style="height:100%; width:84%; background:var(--meil-blue); border-radius:4px;"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span><strong>Water Recycling &amp; Circularity (Target: 45% recycling)</strong></span>
                  <strong style="color:#0284c7;">41.2% / 45.0% (91% Achieved)</strong>
                </div>
                <div style="height:8px; border-radius:4px; background:var(--bg-surface-tertiary); overflow:hidden;">
                  <div style="height:100%; width:91%; background:#0284c7; border-radius:4px;"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span><strong>Zero Serious Injuries (Target: 0.00 LTIFR)</strong></span>
                  <strong style="color:var(--color-warning);">0.04 LTIFR (Near Target)</strong>
                </div>
                <div style="height:8px; border-radius:4px; background:var(--bg-surface-tertiary); overflow:hidden;">
                  <div style="height:100%; width:96%; background:var(--color-warning); border-radius:4px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Shortcuts Row -->
      <div class="card" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h4 style="margin:0 0 4px 0; font-size:14px; color:var(--meil-navy);">Executive Decision Actions</h4>
            <p style="margin:0; font-size:12px; color:var(--text-muted);">Launch simulations, drill down to project sites, or audit detected risk hotspots.</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary" onclick="controlTowerModule.switchTab('hierarchy')">
              <i data-lucide="sitemap"></i> Explore Hierarchy
            </button>
            <button class="btn btn-secondary" onclick="controlTowerModule.switchTab('map')">
              <i data-lucide="map-pin"></i> Project Geo-Map
            </button>
            <button class="btn btn-brand-red" onclick="controlTowerModule.switchTab('simulator')">
              <i data-lucide="sliders"></i> Run What-If Decarbonization Simulation
            </button>
          </div>
        </div>
      </div>
    `;

    // Render GHG Scope Chart with Chart.js
    setTimeout(() => {
      const ctx = document.getElementById('controlTowerGhgChart');
      if (ctx && window.Chart) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Scope 1 (Direct)', 'Scope 2 (Electricity)', 'Scope 3 (Value Chain)'],
            datasets: [{
              label: 'Emissions (tCO2e)',
              data: [m.scope1, m.scope2, m.scope3],
              backgroundColor: ['#c8102e', '#d97706', '#0b2545'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (item) => ` ${item.raw.toLocaleString('en-IN')} tCO2e`
                }
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: { callback: (v) => `${v.toLocaleString('en-IN')} t` }
              }
            }
          }
        });
      }
    }, 50);
  }

  // =========================================================================
  // TAB 2: INTERACTIVE PROJECT MAP WITH FUNCTIONAL FALLBACK
  // =========================================================================
  getMapProjects() {
    const projs = store.getProjects('all') || [];
    const subs = store.getSubsidiaries() || [];

    // Coordinates repository for MEIL projects
    const geoMap = {
      'prj-01': { lat: 34.298, lng: 75.210, city: 'Sonamarg - Baltal', state: 'Jammu & Kashmir' },
      'prj-02': { lat: 18.824, lng: 79.914, city: 'Medigadda', state: 'Telangana' },
      'prj-03': { lat: 17.589, lng: 78.572, city: 'Hyderabad', state: 'Telangana' },
      'prj-04': { lat: 19.218, lng: 72.978, city: 'Thane', state: 'Maharashtra' },
      'prj-05': { lat: 16.989, lng: 82.247, city: 'Kakinada', state: 'Andhra Pradesh' }
    };

    return projs.map((p, idx) => {
      const sub = subs.find(s => s.id === p.subsidiaryId);
      const coords = geoMap[p.id] || {
        lat: 16.5 + (idx * 2.8) % 12,
        lng: 76.0 + (idx * 3.4) % 10,
        city: p.city || 'Site Facility',
        state: p.state || 'India'
      };

      const env = p.environment || {};
      const soc = p.social || {};
      const s1 = Number(env.scope1 || env.ghgScope1 || 0);
      const s2 = Number(env.scope2 || env.ghgScope2 || 0);
      const s3 = Number(env.scope3 || env.ghgScope3 || 0);
      const totalGHG = s1 + s2 + s3;
      const completeness = Number(p.esgCompletion || 0);
      const incidents = Number(soc.recordableIncidents || 0) + Number(soc.fatalities || 0);
      const isOverdue = p.submissionStatus === 'Correction Required' || p.submissionStatus === 'Draft';

      // Determine ESG Health Status
      let health = 'Good';
      let healthColor = '#059669'; // green
      let healthScore = completeness;

      if (isOverdue || incidents > 1 || totalGHG > 4000) {
        health = 'Action Needed';
        healthColor = '#dc2626'; // red
      } else if (completeness < 90 || incidents > 0 || totalGHG > 2000) {
        health = 'Moderate Risk';
        healthColor = '#d97706'; // amber
      }

      return {
        ...p,
        subsidiaryName: sub?.shortName || sub?.name || 'Subsidiary',
        lat: coords.lat,
        lng: coords.lng,
        city: coords.city,
        state: coords.state,
        totalGHG,
        scope1: s1,
        scope2: s2,
        scope3: s3,
        safetyIncidents: incidents,
        isOverdue,
        health,
        healthColor,
        healthScore
      };
    });
  }

  renderMapTab(container) {
    const projects = this.getMapProjects();

    container.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="map" style="color:var(--meil-navy);"></i>
            <span>Interactive Project ESG Health Geo-Visualization</span>
          </div>
          <!-- Legend -->
          <div style="display:flex; align-items:center; gap:14px; font-size:11px;">
            <span style="display:flex; align-items:center; gap:4px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#059669; display:inline-block;"></span>
              <strong>Good Health (Complete / Low Risk)</strong>
            </span>
            <span style="display:flex; align-items:center; gap:4px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#d97706; display:inline-block;"></span>
              <strong>Moderate Risk</strong>
            </span>
            <span style="display:flex; align-items:center; gap:4px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#dc2626; display:inline-block;"></span>
              <strong>Action Needed (Hotspot / Overdue)</strong>
            </span>
          </div>
        </div>

        <div class="card-body" style="padding:16px;">
          <!-- Filter Controls -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="filter-label" style="font-size:12px;"><i data-lucide="filter"></i> Filter Health:</span>
              <button class="btn btn-sm ${this.activeMapFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="controlTowerModule.filterMap('all')">All Projects (${projects.length})</button>
              <button class="btn btn-sm ${this.activeMapFilter === 'Good' ? 'btn-success' : 'btn-outline'}" onclick="controlTowerModule.filterMap('Good')">Good</button>
              <button class="btn btn-sm ${this.activeMapFilter === 'Moderate Risk' ? 'btn-warning' : 'btn-outline'}" onclick="controlTowerModule.filterMap('Moderate Risk')">Moderate Risk</button>
              <button class="btn btn-sm ${this.activeMapFilter === 'Action Needed' ? 'btn-danger' : 'btn-outline'}" onclick="controlTowerModule.filterMap('Action Needed')">Action Needed</button>
            </div>
            <div style="font-size:11px; color:var(--text-muted);">
              <i data-lucide="info" style="width:13px; height:13px; display:inline; vertical-align:middle;"></i>
              Click any project pin or row below for full audit drill-down.
            </div>
          </div>

          <!-- Map Container & Dynamic Visualizer -->
          <div style="position:relative; width:100%; height:460px; background:linear-gradient(180deg, #07192f 0%, #0b2545 100%); border-radius:var(--radius-lg); overflow:hidden; border:1px solid var(--border-medium); box-shadow:inset 0 2px 8px rgba(0,0,0,0.4);" id="controlTowerMapWrapper">
            <!-- Leaflet Container (if online/available) -->
            <div id="controlTowerLeafletMap" style="width:100%; height:100%; z-index:1;"></div>

            <!-- Functional Interactive Fallback Canvas (renders if Leaflet tile fails or offline) -->
            <div id="controlTowerMapFallback" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; z-index:2; padding:24px; pointer-events:none;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="background:rgba(11,37,69,0.85); padding:8px 14px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:11px;">
                  <strong style="display:block; color:#38bdf8;">PAN-INDIA ESG HEALTH RADAR</strong>
                  <span>Interactive Geo-Grid System Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clickable Projects Table with ESG Health Metrics -->
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="list-filter" style="color:var(--meil-navy);"></i>
            <span>Project ESG Health &amp; Metric Matrix</span>
          </div>
          <span class="badge badge-secondary" id="mapFilteredCount">${projects.length} Projects Listed</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Project / Code</th>
                  <th>Subsidiary</th>
                  <th>Location</th>
                  <th>ESG Completeness</th>
                  <th>Total GHG (tCO2e)</th>
                  <th>Safety Incidents</th>
                  <th>Submission</th>
                  <th>ESG Health</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="mapProjectTableBody">
                ${this.renderMapTableRows(projects)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.initProjectMap(projects);
    }, 100);
  }

  renderMapTableRows(projects) {
    const filtered = this.activeMapFilter === 'all' 
      ? projects 
      : projects.filter(p => p.health === this.activeMapFilter);

    if (filtered.length === 0) {
      return `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No projects match the selected health filter.</td></tr>`;
    }

    return filtered.map(p => `
      <tr style="cursor:pointer;" onclick="controlTowerModule.openProjectDetailModal('${p.id}')">
        <td>
          <strong style="color:var(--meil-navy);">${p.name}</strong>
          <span style="display:block; font-size:11px; color:var(--text-muted); font-family:monospace;">${p.code}</span>
        </td>
        <td>${p.subsidiaryName}</td>
        <td><i data-lucide="map-pin" style="width:12px; height:12px; display:inline;"></i> ${p.city}, ${p.state}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; width:60px;">
              <div style="height:100%; width:${p.esgCompletion}%; background:#059669;"></div>
            </div>
            <span style="font-weight:700; font-size:12px;">${p.esgCompletion}%</span>
          </div>
        </td>
        <td>
          <strong>${p.totalGHG.toLocaleString('en-IN')}</strong>
          <span style="display:block; font-size:10px; color:var(--text-muted);">S1: ${p.scope1} | S2: ${p.scope2}</span>
        </td>
        <td>
          <span style="color:${p.safetyIncidents > 0 ? '#dc2626' : '#059669'}; font-weight:700;">
            ${p.safetyIncidents} incident(s)
          </span>
        </td>
        <td>
          <span class="badge ${p.submissionStatus === 'Approved' ? 'badge-approved' : (p.submissionStatus === 'Submitted' ? 'badge-info' : 'badge-correction')}">
            ${p.submissionStatus}
          </span>
        </td>
        <td>
          <span class="badge" style="background:${p.healthColor}20; color:${p.healthColor}; border:1px solid ${p.healthColor}; font-weight:700;">
            ${p.health}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); controlTowerModule.openSimulatorForProject('${p.id}')" title="Simulate Decarbonization">
            <i data-lucide="sliders"></i> Simulate
          </button>
        </td>
      </tr>
    `).join('');
  }

  filterMap(filter) {
    this.activeMapFilter = filter;
    const projects = this.getMapProjects();
    const tbody = document.getElementById('mapProjectTableBody');
    const badge = document.getElementById('mapFilteredCount');
    if (tbody) tbody.innerHTML = this.renderMapTableRows(projects);
    if (badge) {
      const count = filter === 'all' ? projects.length : projects.filter(p => p.health === filter).length;
      badge.textContent = `${count} Projects Listed`;
    }

    // Update map markers
    if (this.mapInstance && typeof L !== 'undefined') {
      this.updateLeafletMarkers(projects);
    }
    if (window.lucide) lucide.createIcons();
  }

  initProjectMap(projects) {
    const mapEl = document.getElementById('controlTowerLeafletMap');
    const fallbackEl = document.getElementById('controlTowerMapFallback');
    if (!mapEl) return;

    // Check if Leaflet L is loaded via CDN
    if (typeof L !== 'undefined') {
      try {
        if (this.mapInstance) {
          this.mapInstance.remove();
          this.mapInstance = null;
        }

        // Center on India [20.5937, 78.9629]
        this.mapInstance = L.map('controlTowerLeafletMap', {
          zoomControl: true,
          attributionControl: true
        }).setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap | MEIL Control Tower'
        }).addTo(this.mapInstance);

        this.updateLeafletMarkers(projects);
        return;
      } catch (err) {
        console.warn('[Control Tower Map] Leaflet init fallback triggered:', err);
      }
    }

    // Functional Fallback: Render custom SVG/DOM interactive radar map
    this.renderFallbackInteractiveMap(projects, mapEl, fallbackEl);
  }

  updateLeafletMarkers(projects) {
    if (!this.mapInstance || typeof L === 'undefined') return;

    if (this.mapLayerGroup) {
      this.mapLayerGroup.clearLayers();
    } else {
      this.mapLayerGroup = L.layerGroup().addTo(this.mapInstance);
    }

    const filtered = this.activeMapFilter === 'all' 
      ? projects 
      : projects.filter(p => p.health === this.activeMapFilter);

    filtered.forEach(p => {
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background:${p.healthColor}; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:800; cursor:pointer;" title="${p.name}">
            ${p.health === 'Action Needed' ? '!' : '●'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width:200px;">
          <h4 style="margin:0 0 4px 0; color:#0b2545; font-size:13px;">${p.name}</h4>
          <span style="font-size:11px; color:#64748b; display:block; margin-bottom:8px;">${p.subsidiaryName} • ${p.city}</span>
          <div style="font-size:11px; margin-bottom:4px;"><strong>ESG Health:</strong> <span style="color:${p.healthColor}; font-weight:700;">${p.health}</span></div>
          <div style="font-size:11px; margin-bottom:4px;"><strong>Completeness:</strong> ${p.esgCompletion}%</div>
          <div style="font-size:11px; margin-bottom:4px;"><strong>Total Emissions:</strong> ${p.totalGHG.toLocaleString('en-IN')} tCO2e</div>
          <div style="font-size:11px; margin-bottom:8px;"><strong>Status:</strong> ${p.submissionStatus}</div>
          <button class="btn btn-sm btn-primary" style="width:100%; font-size:11px; padding:4px;" onclick="controlTowerModule.openProjectDetailModal('${p.id}')">View Full Details</button>
        </div>
      `);
      this.mapLayerGroup.addLayer(marker);
    });
  }

  renderFallbackInteractiveMap(projects, mapEl, fallbackEl) {
    if (fallbackEl) fallbackEl.style.display = 'block';

    mapEl.innerHTML = `
      <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#07192f;">
        <svg viewBox="0 0 800 500" style="width:100%; height:100%; opacity:0.85;">
          <!-- India Coordinate Canvas Map Grid -->
          <defs>
            <radialGradient id="gridGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#07192f" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="url(#gridGlow)"/>
          
          <!-- Latitude / Longitude Guide Lines -->
          <line x1="100" y1="120" x2="700" y2="120" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>
          <line x1="100" y1="240" x2="700" y2="240" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>
          <line x1="100" y1="360" x2="700" y2="360" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>
          <line x1="250" y1="50" x2="250" y2="450" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>
          <line x1="450" y1="50" x2="450" y2="450" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>
          <line x1="650" y1="50" x2="650" y2="450" stroke="#334155" stroke-dasharray="4" opacity="0.4"/>

          <!-- Map Outline Shape for India (Simplified clean geometric representation) -->
          <path d="M 380 70 L 410 110 L 450 150 L 520 180 L 570 200 L 560 250 L 520 280 L 460 380 L 430 430 L 410 400 L 370 320 L 320 250 L 290 200 L 310 140 Z" fill="rgba(14, 116, 144, 0.15)" stroke="#0284c7" stroke-width="2"/>
          <text x="390" y="240" fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle" letter-spacing="3">MEIL ENTERPRISE RADAR</text>

          <!-- Interactive Pins -->
          ${projects.map((p, idx) => {
            // Coordinate mapping to 800x500 box: Lon 72..85 -> 280..580, Lat 35..15 -> 90..410
            const x = 280 + ((p.lng - 72) / 14) * 300;
            const y = 90 + ((35 - p.lat) / 20) * 320;
            return `
              <g style="cursor:pointer;" onclick="controlTowerModule.openProjectDetailModal('${p.id}')">
                <circle cx="${x}" cy="${y}" r="14" fill="${p.healthColor}" opacity="0.3">
                  <animate attributeName="r" values="10;18;10" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${x}" cy="${y}" r="8" fill="${p.healthColor}" stroke="#ffffff" stroke-width="2"/>
                <text x="${x + 12}" y="${y + 4}" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold">${p.code}</text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  }

  // =========================================================================
  // TAB 3: ORGANIZATIONAL DRILL-DOWN (GROUP -> SUBSIDIARY -> BU -> PROJECT)
  // =========================================================================
  renderHierarchyTab(container) {
    const mainCompany = store.getMainCompany();
    const subs = store.getSubsidiaries() || [];
    const bus = store.getBusinessUnits('all') || [];
    const projs = store.getProjects('all') || [];

    container.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="sitemap" style="color:var(--meil-navy);"></i>
            <span>MEIL Multi-Tier Organizational Drill-Down</span>
          </div>
          <span class="badge badge-primary">Group &rarr; Subsidiary &rarr; Business Unit &rarr; Project</span>
        </div>
        <div class="card-body">
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:20px;">
            Seamless hierarchical drill-down from parent conglomerate oversight into each operational division and site-level sustainability disclosures:
          </p>

          <!-- Level 1: Main Conglomerate Node -->
          <div class="card" style="border:2px solid var(--meil-navy); background:linear-gradient(135deg, #0b2545 0%, #133b5c 100%); color:#fff; padding:18px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:44px; height:44px; border-radius:8px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center;">
                  <i data-lucide="shield-check" style="width:24px; height:24px; color:#38bdf8;"></i>
                </div>
                <div>
                  <h3 style="margin:0 0 2px 0; font-size:16px; color:#fff;">${mainCompany.name}</h3>
                  <span style="font-size:12px; color:#cbd5e1;">CIN: ${mainCompany.cin} • Headquarters: Hyderabad, Telangana</span>
                </div>
              </div>
              <div style="display:flex; gap:14px; text-align:right;">
                <div>
                  <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; display:block;">Active Subsidiaries</span>
                  <strong style="font-size:16px; color:#fff;">${subs.length}</strong>
                </div>
                <div>
                  <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; display:block;">Business Units</span>
                  <strong style="font-size:16px; color:#fff;">${bus.length}</strong>
                </div>
                <div>
                  <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; display:block;">Projects Tracked</span>
                  <strong style="font-size:16px; color:#fff;">${projs.length}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Level 2 to 4: Subsidiaries with nested BUs and Projects -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${subs.map(sub => {
              const subBUs = bus.filter(bu => bu.subsidiaryId === sub.id);
              const subProjs = projs.filter(p => p.subsidiaryId === sub.id);
              const subScope1 = subProjs.reduce((acc, p) => acc + Number(p.environment?.scope1 || p.environment?.ghgScope1 || 0), 0);
              const subScope2 = subProjs.reduce((acc, p) => acc + Number(p.environment?.scope2 || p.environment?.ghgScope2 || 0), 0);

              return `
                <div class="card" style="border:1px solid var(--border-medium); background:var(--bg-surface-secondary); padding:16px;">
                  <!-- Subsidiary Header -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <i data-lucide="building-2" style="color:var(--meil-navy); width:20px; height:20px;"></i>
                      <div>
                        <strong style="font-size:14px; color:var(--meil-navy);">${sub.name}</strong>
                        <span style="font-size:11px; color:var(--text-muted); display:block;">${sub.businessType} • ${sub.headquarters}</span>
                      </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                      <span class="badge ${sub.status === 'Active' ? 'badge-approved' : 'badge-secondary'}">${sub.status}</span>
                      <span style="font-size:12px; font-weight:600; color:var(--text-primary);">
                        Compliance Score: <strong>${sub.complianceScore}%</strong>
                      </span>
                      <span style="font-size:11px; color:var(--text-muted);">
                        S1: ${subScope1.toLocaleString('en-IN')} t | S2: ${subScope2.toLocaleString('en-IN')} t
                      </span>
                    </div>
                  </div>

                  <!-- Nested Business Units & Projects -->
                  <div style="margin-left:20px; border-left:2px solid var(--border-medium); padding-left:14px; display:flex; flex-direction:column; gap:10px;">
                    ${subBUs.map(bu => {
                      const buProjs = projs.filter(p => p.buId === bu.id || p.businessUnitId === bu.id);
                      return `
                        <div style="background:#fff; border:1px solid var(--border-light); border-radius:var(--radius-md); padding:12px;">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <div style="display:flex; align-items:center; gap:6px;">
                              <i data-lucide="network" style="width:14px; height:14px; color:var(--meil-blue);"></i>
                              <strong style="font-size:13px; color:var(--text-primary);">${bu.name}</strong>
                              <span style="font-size:11px; color:var(--text-muted);">(${bu.activities})</span>
                            </div>
                            <span class="badge ${bu.esgStatus === 'Approved' ? 'badge-approved' : 'badge-correction'}" style="font-size:10px;">
                              ${bu.esgStatus}
                            </span>
                          </div>

                          <!-- Projects in this BU -->
                          <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
                            ${buProjs.map(p => `
                              <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--bg-surface-secondary); border-radius:4px; font-size:12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                  <i data-lucide="hard-hat" style="width:12px; height:12px; color:#64748b;"></i>
                                  <a href="javascript:void(0)" onclick="controlTowerModule.openProjectDetailModal('${p.id}')" style="font-weight:600; color:var(--meil-navy); text-decoration:none;">
                                    ${p.name} (${p.code})
                                  </a>
                                  <span style="font-size:11px; color:var(--text-muted);">${p.location}</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                  <span>ESG: <strong>${p.esgCompletion}%</strong></span>
                                  <span>Scope 1: <strong>${p.environment?.scope1 || 0} t</strong></span>
                                  <button class="btn btn-sm btn-outline" style="font-size:10px; padding:2px 6px;" onclick="controlTowerModule.openSimulatorForProject('${p.id}')">
                                    Simulate
                                  </button>
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 4: ESG HOTSPOT DETECTION (CALCULATED FROM LIVE STORE)
  // =========================================================================
  calculateHotspots() {
    const projs = store.getProjects('all') || [];
    const subs = store.getSubsidiaries() || [];
    const hotspots = [];

    // Calculate group diesel/emission averages
    let totalScope1 = 0;
    projs.forEach(p => {
      totalScope1 += Number(p.environment?.scope1 || p.environment?.ghgScope1 || 0);
    });

    projs.forEach(p => {
      const s1 = Number(p.environment?.scope1 || p.environment?.ghgScope1 || 0);
      const s2 = Number(p.environment?.scope2 || p.environment?.ghgScope2 || 0);
      const incidents = Number(p.social?.recordableIncidents || 0) + Number(p.social?.fatalities || 0);
      const completeness = Number(p.esgCompletion || 0);
      const sub = subs.find(s => s.id === p.subsidiaryId);

      // Rule 1: High Scope 1 Concentration (> 20% of total group Scope 1)
      if (totalScope1 > 0 && s1 / totalScope1 >= 0.20) {
        hotspots.push({
          id: `hotspot-s1-${p.id}`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          subsidiary: sub?.shortName || 'Subsidiary',
          category: 'High Emissions',
          severity: 'CRITICAL',
          badgeClass: 'badge-danger',
          metricTitle: 'High Scope 1 Carbon Concentration',
          observedValue: `${s1.toLocaleString('en-IN')} tCO2e (${((s1/totalScope1)*100).toFixed(1)}% of Group Total)`,
          explanation: `Heavy point-source fuel combustion from intensive excavation and generators. Generates disproportionate direct emissions compared to group baseline.`,
          recommendedAction: `Deploy hybrid electrified machinery or migrate diesel generators to dedicated solar microgrids.`
        });
      }

      // Rule 2: Incomplete ESG disclosures (< 80%)
      if (completeness < 85) {
        hotspots.push({
          id: `hotspot-comp-${p.id}`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          subsidiary: sub?.shortName || 'Subsidiary',
          category: 'Incomplete ESG Data',
          severity: 'HIGH',
          badgeClass: 'badge-warning',
          metricTitle: 'Incomplete Statutory BRSR Disclosures',
          observedValue: `${completeness}% (Threshold: 85%)`,
          explanation: `Key disclosures missing in Section C Environmental or Governance indicators, preventing group-level statutory audit closure.`,
          recommendedAction: `Instruct subsidiary site reporting officers to upload verifiable energy bills and third-party calibration slips.`
        });
      }

      // Rule 3: Safety Incidents Recorded
      if (incidents > 0) {
        hotspots.push({
          id: `hotspot-safety-${p.id}`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          subsidiary: sub?.shortName || 'Subsidiary',
          category: 'Safety Issues',
          severity: incidents >= 2 ? 'CRITICAL' : 'HIGH',
          badgeClass: incidents >= 2 ? 'badge-danger' : 'badge-warning',
          metricTitle: 'Workplace Safety & Incident Infractions',
          observedValue: `${incidents} Recordable Incident(s)`,
          explanation: `Site safety audit noted workplace incidents during high-altitude excavation or crane operations.`,
          recommendedAction: `Mandate mandatory contractor safety training refreshers and verify site-specific safety protocols.`
        });
      }

      // Rule 4: Overdue Submissions / Action Required
      if (p.submissionStatus === 'Correction Required' || p.submissionStatus === 'Rejected') {
        hotspots.push({
          id: `hotspot-overdue-${p.id}`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          subsidiary: sub?.shortName || 'Subsidiary',
          category: 'Overdue Submissions',
          severity: 'HIGH',
          badgeClass: 'badge-warning',
          metricTitle: 'Pending Review / Resubmission Overdue',
          observedValue: `Status: ${p.submissionStatus}`,
          explanation: `Reviewer requested revision on measurement methodology; data remains isolated from consolidated group totals.`,
          recommendedAction: `Notify subsidiary admin to resolve reviewer remarks and submit revised documentation.`
        });
      }
    });

    return hotspots;
  }

  renderHotspotsTab(container) {
    const hotspots = this.calculateHotspots();

    container.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="alert-triangle" style="color:var(--color-danger);"></i>
            <span>Automated ESG Hotspot Detection Engine</span>
          </div>
          <span class="badge badge-danger">${hotspots.length} Active Hotspot Items Identified</span>
        </div>
        <div class="card-body">
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
            Calculated dynamically from real project performance metrics across 4 core risk categories: high carbon emissions, incomplete data completeness, safety incidents, and overdue reviewer turnaround:
          </p>

          <!-- Hotspots Grid List -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${hotspots.map(h => `
              <div class="card" style="border-left: 4px solid ${h.severity === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning)'}; background:var(--bg-surface-secondary); padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="badge ${h.badgeClass}" style="font-size:11px;">${h.severity}</span>
                      <span class="badge badge-secondary" style="font-size:11px;">${h.category}</span>
                      <strong style="font-size:14px; color:var(--meil-navy);">${h.projectName} (${h.projectCode})</strong>
                    </div>
                    <span style="font-size:12px; color:var(--text-muted); display:block; margin-top:2px;">
                      Subsidiary: <strong>${h.subsidiary}</strong> | Metric: <strong>${h.metricTitle}</strong>
                    </span>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:11px; color:var(--text-muted); display:block;">Observed Metric:</span>
                    <strong style="color:var(--color-danger); font-size:13px;">${h.observedValue}</strong>
                  </div>
                </div>

                <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px; line-height:1.5;">
                  <strong>Risk Rationale:</strong> ${h.explanation}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid var(--border-light); flex-wrap:wrap; gap:8px;">
                  <span style="font-size:11px; color:var(--color-success); font-weight:600;">
                    <i data-lucide="check-circle" style="width:12px; height:12px; display:inline;"></i> Recommended Mitigation: ${h.recommendedAction}
                  </span>
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-sm btn-outline" onclick="controlTowerModule.openProjectDetailModal('${h.projectId}')">
                      Project Details
                    </button>
                    ${h.category === 'High Emissions' ? `
                      <button class="btn btn-sm btn-brand-red" onclick="controlTowerModule.openSimulatorForProject('${h.projectId}')">
                        <i data-lucide="sliders"></i> Simulate Mitigation
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 5: WHAT-IF SIMULATOR (DYNAMIC SCENARIOS & SAMPLE ASSUMPTIONS)
  // =========================================================================
  renderSimulatorTab(container) {
    const projects = store.getProjects('all') || [];
    const selectedProjId = this.selectedProjectForSim || (projects.length > 0 ? projects[0].id : '');
    const proj = projects.find(p => p.id === selectedProjId) || projects[0];

    const currentDieselLitres = (Number(proj?.environment?.fuelConsumptionKL || 0) * 1000) || 50000;
    const currentScope1 = Number(proj?.environment?.scope1 || (currentDieselLitres * 0.00268)) || 134;

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: 420px 1fr; gap:20px; align-items:start;">
        <!-- Left Column: Scenario Configuration -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="sliders" style="color:var(--meil-navy);"></i>
              <span>Scenario Parameters</span>
            </div>
            <span class="badge badge-primary">What-If Engine</span>
          </div>
          <div class="card-body">
            <!-- Project Selection -->
            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label" style="font-weight:600; font-size:12px;">Target Project Entity</label>
              <select id="sim-project-select" class="form-control" onchange="controlTowerModule.onSimulatorProjectChanged(this.value)">
                ${projects.map(p => `
                  <option value="${p.id}" ${p.id === selectedProjId ? 'selected' : ''}>
                    ${p.name} (${p.code})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Baseline Metrics Indicator -->
            <div style="background:var(--bg-surface-secondary); padding:10px 12px; border-radius:6px; border:1px solid var(--border-light); margin-bottom:16px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:var(--text-muted);">Baseline Fuel Consumption:</span>
                <strong>${currentDieselLitres.toLocaleString('en-IN')} Litres Diesel</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted);">Baseline Scope 1 Emissions:</span>
                <strong style="color:var(--color-danger);">${currentScope1.toLocaleString('en-IN')} tCO2e</strong>
              </div>
            </div>

            <!-- Scenario Type Dropdown -->
            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label" style="font-weight:600; font-size:12px;">Intervention Strategy</label>
              <select id="sim-strategy" class="form-control" onchange="controlTowerModule.recalculateSimulation()">
                <option value="solar">Shift Diesel to On-Site Solar PV &amp; BESS</option>
                <option value="grid">Shift Diesel to Clean Grid Electricity</option>
                <option value="electric_fleet">Replace Diesel Machinery with Pure Electric Fleet</option>
              </select>
            </div>

            <!-- Transition Percentage Slider -->
            <div class="form-group" style="margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label class="form-label" style="font-weight:600; font-size:12px; margin:0;">Substitution Share (%)</label>
                <span id="sim-pct-label" style="font-size:13px; font-weight:800; color:var(--meil-navy);">30%</span>
              </div>
              <input type="range" id="sim-percentage-slider" min="5" max="100" step="5" value="30" style="width:100%;" oninput="document.getElementById('sim-pct-label').textContent = this.value + '%'; controlTowerModule.recalculateSimulation();">
              <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:2px;">
                <span>5% Pilot</span>
                <span>30% Standard</span>
                <span>50% Aggressive</span>
                <span>100% Full Transition</span>
              </div>
            </div>

            <!-- Unit Cost Assumption Controls -->
            <div style="border-top:1px solid var(--border-light); padding-top:12px; margin-bottom:16px;">
              <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:8px;">Model Assumptions (Customizable)</span>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                <div>
                  <label style="font-size:10px; color:var(--text-muted); display:block;">Diesel Cost (₹/L)</label>
                  <input type="number" id="sim-diesel-cost" class="form-control" value="92.5" step="0.5" oninput="controlTowerModule.recalculateSimulation()" style="font-size:11px; padding:4px 8px;">
                </div>
                <div>
                  <label style="font-size:10px; color:var(--text-muted); display:block;">Clean Power Cost (₹/kWh)</label>
                  <input type="number" id="sim-clean-cost" class="form-control" value="4.8" step="0.2" oninput="controlTowerModule.recalculateSimulation()" style="font-size:11px; padding:4px 8px;">
                </div>
              </div>
            </div>

            <button class="btn btn-primary" style="width:100%;" onclick="controlTowerModule.recalculateSimulation()">
              <i data-lucide="calculator"></i>
              <span>Recalculate Scenario Results</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Simulation Results & Forecast Visualization -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="line-chart" style="color:var(--color-success);"></i>
              <span>Estimated Impact &amp; Decarbonization Forecast</span>
            </div>
            <!-- Mandatory Regulatory Label -->
            <span class="badge badge-warning" style="font-size:10px; font-weight:700;">
              Hypothetical Simulation — Not Measured Reductions
            </span>
          </div>
          <div class="card-body">
            <!-- Simulated Metric Output Cards -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:20px;" id="sim-metric-cards">
              <!-- Dynamically rendered -->
            </div>

            <!-- Comparison Chart -->
            <div style="height:260px; position:relative; margin-bottom:16px;">
              <canvas id="controlTowerSimChart"></canvas>
            </div>

            <!-- Model Calculation Assumptions Legend -->
            <div style="padding:12px 14px; border-radius:var(--radius-md); background:var(--bg-surface-tertiary); border:1px solid var(--border-light); font-size:11px; color:var(--text-secondary); line-height:1.5;">
              <strong style="color:var(--text-primary); display:block; margin-bottom:4px;">Calculation Model &amp; Emission Factor Assumptions:</strong>
              • Diesel emission factor: <strong>2.68 kg CO2e / litre</strong> (SEBI BRSR Core Standard Guidance).<br>
              • Diesel energy equivalent: <strong>1 Litre diesel ≈ 3.5 kWh</strong> usable electrical generator output.<br>
              • Solar generation factor: <strong>0.00 kg CO2e / kWh</strong> direct operational emissions.<br>
              • Grid electricity factor (if selected): <strong>0.716 kg CO2e / kWh</strong> (Central Electricity Authority Baseline v20).<br>
              • <em>Note: All displayed values represent forward-looking engineering approximations for capital allocation planning and are not audited actual reductions.</em>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.recalculateSimulation();
    }, 50);
  }

  onSimulatorProjectChanged(projId) {
    this.selectedProjectForSim = projId;
    const container = document.getElementById('control-tower-content');
    if (container) this.renderSimulatorTab(container);
  }

  openSimulatorForProject(projId) {
    this.selectedProjectForSim = projId;
    this.switchTab('simulator');
  }

  recalculateSimulation() {
    const projects = store.getProjects('all') || [];
    const projId = document.getElementById('sim-project-select')?.value || this.selectedProjectForSim || projects[0]?.id;
    const proj = projects.find(p => p.id === projId) || projects[0];

    const strategy = document.getElementById('sim-strategy')?.value || 'solar';
    const subPct = Number(document.getElementById('sim-percentage-slider')?.value || 30);
    const dieselRate = Number(document.getElementById('sim-diesel-cost')?.value || 92.5);
    const cleanRate = Number(document.getElementById('sim-clean-cost')?.value || 4.8);

    const baselineLitres = (Number(proj?.environment?.fuelConsumptionKL || 0) * 1000) || 50000;
    const baselineScope1 = baselineLitres * 0.00268; // tonnes
    const baselineDieselCostInr = baselineLitres * dieselRate;

    // Fuel reduction
    const litresReplaced = baselineLitres * (subPct / 100);
    const newDieselLitres = baselineLitres - litresReplaced;
    const newDieselCost = newDieselLitres * dieselRate;

    // Electricity required (1 L diesel ≈ 3.5 kWh)
    const requiredKWh = litresReplaced * 3.5;
    const cleanPowerCost = requiredKWh * cleanRate;

    // Net Scope 1 + 2 post intervention
    let newScope1 = newDieselLitres * 0.00268;
    let addedScope2 = 0;
    if (strategy === 'grid') {
      addedScope2 = (requiredKWh * 0.716) / 1000; // tonnes
    }

    const postInterventionGHG = newScope1 + addedScope2;
    const avoidedGHG = baselineScope1 - postInterventionGHG;
    const avoidedGHGPct = ((avoidedGHG / baselineScope1) * 100).toFixed(1);

    const totalNewCost = newDieselCost + cleanPowerCost;
    const costSavedInr = baselineDieselCostInr - totalNewCost;

    // Update Output Cards
    const cardsEl = document.getElementById('sim-metric-cards');
    if (cardsEl) {
      cardsEl.innerHTML = `
        <div class="card" style="padding:12px; border-left:3px solid var(--color-success); background:var(--bg-surface-secondary);">
          <span style="font-size:11px; color:var(--text-muted); display:block;">Avoided GHG Emissions</span>
          <strong style="font-size:20px; color:var(--color-success);">${avoidedGHG.toFixed(1)} tCO2e</strong>
          <span style="font-size:10px; color:var(--color-success); display:block; margin-top:2px;">-${avoidedGHGPct}% Reduction</span>
        </div>

        <div class="card" style="padding:12px; border-left:3px solid var(--meil-blue); background:var(--bg-surface-secondary);">
          <span style="font-size:11px; color:var(--text-muted); display:block;">Est. Annual Cost Impact</span>
          <strong style="font-size:20px; color:var(--meil-navy);">₹${(costSavedInr / 100000).toFixed(2)} Lakhs</strong>
          <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:2px;">Net Opex Savings</span>
        </div>

        <div class="card" style="padding:12px; border-left:3px solid var(--color-warning); background:var(--bg-surface-secondary);">
          <span style="font-size:11px; color:var(--text-muted); display:block;">Diesel Volume Displaced</span>
          <strong style="font-size:20px; color:var(--text-primary);">${Math.round(litresReplaced).toLocaleString('en-IN')} L</strong>
          <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:2px;">${subPct}% of Project Fleet</span>
        </div>
      `;
    }

    // Render / Update Chart.js Comparison
    const ctx = document.getElementById('controlTowerSimChart');
    if (ctx && window.Chart) {
      if (this.simChart) {
        try { this.simChart.destroy(); } catch (e) {}
      }

      this.simChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Baseline Operations', `Simulated (${subPct}% Transition)`],
          datasets: [
            {
              label: 'Scope 1 Emissions (tCO2e)',
              data: [Number(baselineScope1.toFixed(1)), Number(newScope1.toFixed(1))],
              backgroundColor: '#c8102e',
              borderRadius: 6
            },
            {
              label: 'Scope 2 Power Emissions (tCO2e)',
              data: [0, Number(addedScope2.toFixed(1))],
              backgroundColor: '#d97706',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (item) => ` ${item.dataset.label}: ${item.raw} tCO2e`
              }
            }
          },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: {
              stacked: true,
              grid: { color: 'rgba(0,0,0,0.06)' },
              ticks: { callback: (v) => `${v} t` }
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // TAB 6: UN SDG & TARGET TRACKING
  // =========================================================================
  renderSdgTab(container) {
    const sdgs = store.getSDGs() || [];
    const mappings = store.getFrameworkMappings() || [];

    container.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="globe-2" style="color:var(--meil-navy);"></i>
            <span>UN Sustainable Development Goals (SDG) Enterprise Tracker</span>
          </div>
          <span class="badge badge-primary">2030 Agenda Alignment</span>
        </div>
        <div class="card-body">
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:18px;">
            MEIL Group actions directly mapped to the UN 2030 Sustainable Development Goals with progress indices and statutory BRSR indicator linkages:
          </p>

          <!-- 17 SDG Grid -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
            ${sdgs.slice(0, 9).map(s => `
              <div class="card" style="border:1px solid var(--border-medium); background:var(--bg-surface-secondary); padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:4px; background:var(--meil-navy); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">
                      ${s.number || s.id}
                    </div>
                    <strong style="font-size:13px; color:var(--meil-navy);">${s.title || s.name}</strong>
                  </div>
                  <span class="badge badge-secondary" style="font-size:10px;">${s.category || 'General'}</span>
                </div>
                <p style="font-size:11px; color:var(--text-muted); margin:0 0 10px 0; line-height:1.4;">
                  ${s.description?.slice(0, 110) || 'Corporate alignment target'}...
                </p>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                    <span>Progress Target:</span>
                    <strong>${s.progress || 75}%</strong>
                  </div>
                  <div style="height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${s.progress || 75}%; background:var(--color-success);"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // DRILL-DOWN MODAL FOR PROJECT
  // =========================================================================
  openProjectDetailModal(projectId) {
    const proj = store.getProjectById(projectId);
    if (!proj) return;

    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-dialog-content');
    if (!modalBackdrop || !modalContent) return;

    const env = proj.environment || {};
    const soc = proj.social || {};
    const gov = proj.governance || {};

    modalContent.innerHTML = `
      <div class="modal-dialog" style="max-width:760px;">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="hard-hat" style="color:var(--meil-navy);"></i>
              ${proj.name}
            </h2>
            <span style="font-size:11px; color:var(--text-muted);">${proj.code} • ${proj.location} • Status: ${proj.submissionStatus}</span>
          </div>
          <button class="modal-close-btn" onclick="ui.closeModals()"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:16px;">
            <div style="background:var(--bg-surface-secondary); padding:10px; border-radius:6px;">
              <span style="font-size:11px; color:var(--text-muted); display:block;">Scope 1 Fuel:</span>
              <strong style="color:var(--color-danger); font-size:14px;">${env.scope1 || 0} tCO2e</strong>
            </div>
            <div style="background:var(--bg-surface-secondary); padding:10px; border-radius:6px;">
              <span style="font-size:11px; color:var(--text-muted); display:block;">Scope 2 Electricity:</span>
              <strong style="color:var(--color-warning); font-size:14px;">${env.scope2 || 0} tCO2e</strong>
            </div>
            <div style="background:var(--bg-surface-secondary); padding:10px; border-radius:6px;">
              <span style="font-size:11px; color:var(--text-muted); display:block;">ESG Completeness:</span>
              <strong style="color:var(--color-success); font-size:14px;">${proj.esgCompletion}%</strong>
            </div>
          </div>

          <h4 style="font-size:13px; color:var(--meil-navy); margin-bottom:8px;">Project Environmental Disclosures</h4>
          <table class="data-table" style="font-size:12px; margin-bottom:16px;">
            <tbody>
              <tr><td>Electricity Consumption</td><td><strong>${(env.electricityConsumptionMWh || 0).toLocaleString()} MWh</strong></td></tr>
              <tr><td>Renewable Electricity Share</td><td><strong>${(env.renewableElectricityMWh || 0).toLocaleString()} MWh</strong></td></tr>
              <tr><td>Water Withdrawal / Consumption</td><td><strong>${(env.waterWithdrawalKL || 0).toLocaleString()} / ${(env.waterConsumptionKL || 0).toLocaleString()} kL</strong></td></tr>
              <tr><td>Waste Recycled</td><td><strong>${env.wasteRecycledMT || 0} MT</strong></td></tr>
              <tr><td>Safety Incidents / Lost Time</td><td><strong style="color:${(soc.recordableIncidents || 0) > 0 ? '#dc2626' : '#059669'}">${soc.recordableIncidents || 0} (LTIFR: ${soc.ltifr || 0.0})</strong></td></tr>
            </tbody>
          </table>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn btn-secondary" onclick="ui.closeModals()">Close</button>
            <button class="btn btn-brand-red" onclick="ui.closeModals(); controlTowerModule.openSimulatorForProject('${proj.id}')">
              <i data-lucide="sliders"></i> Launch What-If Simulator
            </button>
          </div>
        </div>
      </div>
    `;

    modalBackdrop.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }
}

// Global Singleton Instance
const controlTowerModule = new ControlTowerModule();
