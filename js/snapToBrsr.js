/**
 * Snap-to-BRSR Module
 * Module: Sub-Company Admin Only
 * MEIL Centralized ESG & BRSR Reporting Platform
 */

class SnapToBrsrModule {
  constructor() {
    this.uploadedFile = null;
    this.uploadedFilePreviewUrl = null;
    this.selectedBuId = null;
    this.selectedProjectId = null;
    this.editingRecordId = null;
    this.currentExtraction = null;
    this.currentCalculation = null;
  }

  // Role Gate Enforcement: Sub-Company Admin Only
  checkAccess() {
    if (!auth.isSubAdmin()) {
      ui.showToast('Access Restricted: Snap-to-BRSR is for Sub-Company Admins only.', 'warning');
      ui.navigateTo('dashboard');
      return false;
    }
    return true;
  }

  getEvidenceRegister() {
    return store.getSnapEvidenceRecords('all');
  }

  getMySubsidiaryEvidence() {
    const activeSubId = auth.getActiveSubsidiaryId();
    return store.getSnapEvidenceRecords(activeSubId);
  }

  onBusinessUnitChanged(buId) {
    this.selectedBuId = buId;
    const activeSubId = auth.getActiveSubsidiaryId();
    const allProjects = store.getProjects(activeSubId);
    const buProjects = allProjects.filter(p => p.buId === buId || p.businessUnitId === buId);
    const displayProjs = buProjects.length > 0 ? buProjects : allProjects;
    
    const projSelect = document.getElementById('snap-project-select');
    if (projSelect) {
      projSelect.innerHTML = displayProjs.map(p => `
        <option value="${p.id}" ${p.id === this.selectedProjectId ? 'selected' : ''}>
          ${p.name} (${p.code}) — ${p.location}
        </option>
      `).join('');
      if (displayProjs.length > 0) {
        this.selectedProjectId = displayProjs[0].id;
      }
    }
  }

  render(container) {
    if (!this.checkAccess()) return;

    const activeSubId = auth.getActiveSubsidiaryId();
    const activeSub = auth.getActiveSubsidiary();
    const businessUnits = store.getBusinessUnits(activeSubId);
    const projects = store.getProjects(activeSubId);

    if (businessUnits.length > 0 && !this.selectedBuId) {
      this.selectedBuId = businessUnits[0].id;
    }

    if (projects.length > 0 && !this.selectedProjectId) {
      this.selectedProjectId = projects[0].id;
    }

    container.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title-group">
          <div style="display:flex; align-items:center; gap:8px;">
            <h1 class="page-title">
              <i data-lucide="camera" style="color:var(--color-success);"></i>
              Snap-to-BRSR Evidence Ingestion
            </h1>
            <span class="badge badge-info" style="font-size:11px;">Sub-Company Admin Only</span>
            <span class="badge badge-approved" style="font-size:11px;">SEBI BRSR Principle 6 Core</span>
          </div>
          <p class="page-subtitle">Multi-format bill &amp; photo evidence capture: upload diesel bills, electricity bills, weighbridge slips, meter photographs, and other operational receipts for <strong>${activeSub?.name || 'Assigned Subsidiary'}</strong>.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="snapToBrsrModule.loadDemoSample('diesel')">
            <i data-lucide="file-text"></i> Sample Diesel Bill
          </button>
          <button class="btn btn-outline btn-sm" onclick="snapToBrsrModule.loadDemoSample('electricity')">
            <i data-lucide="zap"></i> Sample Electricity Bill
          </button>
          <button class="btn btn-outline btn-sm" onclick="snapToBrsrModule.loadDemoSample('weighbridge')">
            <i data-lucide="truck"></i> Sample Weighbridge Slip
          </button>
          <button class="btn btn-outline btn-sm" onclick="snapToBrsrModule.loadDemoSample('meter')">
            <i data-lucide="camera"></i> Sample Meter Photo
          </button>
        </div>
      </div>

      <!-- Scope Isolation Notice -->
      <div class="alert alert-info" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <i data-lucide="lock" style="width:20px; height:20px; color:var(--meil-navy); flex-shrink:0;"></i>
          <span><strong>Subsidiary Strict Scope:</strong> All evidence uploads and emissions are permanently associated with <strong>${activeSub?.name || 'Assigned Subsidiary'}</strong> and synchronized for Central Admin review.</span>
        </div>
        <span class="badge badge-secondary" style="font-size:11px;">Entity ID: ${activeSubId}</span>
      </div>

      <!-- Main Ingestion 2-Column Responsive Layout -->
      <div class="grid-2-col" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; align-items:start; margin-bottom:24px;">
        <!-- Column 1: Document & Photo Upload -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="upload-cloud" style="color:var(--meil-navy);"></i>
              <span>Step 1: Photo / Document Evidence Upload</span>
            </div>
            <span class="badge badge-secondary" style="font-size:10px;">Mobile &amp; Desktop</span>
          </div>
          <div class="card-body">
            <!-- Business Unit Selection -->
            <div class="form-group" style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label class="form-label" style="font-weight:600; font-size:12px; margin:0;">Associated Business Unit *</label>
                <a href="javascript:void(0)" onclick="ui.showAddBusinessUnitModal()" style="font-size:11px; color:var(--meil-navy); text-decoration:none; font-weight:600;">+ Add Business Unit</a>
              </div>
              <select id="snap-bu-select" class="form-control" onchange="snapToBrsrModule.onBusinessUnitChanged(this.value)">
                ${businessUnits.map(b => `
                  <option value="${b.id}" ${b.id === this.selectedBuId ? 'selected' : ''}>
                    ${b.name} (${b.code || b.id})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Project Selection -->
            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label" style="font-weight:600; font-size:12px;">Associated Project / Site Location *</label>
              <select id="snap-project-select" class="form-control" onchange="snapToBrsrModule.selectedProjectId = this.value">
                ${projects.map(p => `
                  <option value="${p.id}" ${p.id === this.selectedProjectId ? 'selected' : ''}>
                    ${p.name} (${p.code}) — ${p.location}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Upload Area & Drag-Drop -->
            <div id="snap-drop-zone" style="border:2px dashed var(--border-medium); border-radius:var(--radius-lg); padding:28px 16px; text-align:center; background:var(--bg-surface-secondary); cursor:pointer; transition:all 0.2s;" onclick="document.getElementById('snap-file-input').click()">
              <input type="file" id="snap-file-input" style="display:none;" accept="image/jpeg,image/png,image/webp,image/jpg" onchange="snapToBrsrModule.handleFileSelected(this.files)">
              <div style="width:50px; height:50px; border-radius:50%; background:var(--meil-navy); color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                <i data-lucide="camera" style="width:24px; height:24px;"></i>
              </div>
              <h4 style="font-size:14px; margin-bottom:4px; color:var(--text-primary);">Take Photo or Upload Evidence</h4>
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
                Accepts JPG, JPEG, PNG, WEBP files.<br>
                Diesel bills, electricity bills, weighbridge slips, meter photographs, and other operational receipts.
              </p>
              <div style="display:inline-flex; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); document.getElementById('snap-file-input').click();">
                  <i data-lucide="folder-open"></i> Select File
                </button>
              </div>
            </div>

            <!-- Image / Document Preview Area -->
            <div id="snap-preview-container" style="display:none; margin-top:14px; border:1px solid var(--border-light); border-radius:var(--radius-md); overflow:hidden; background:var(--bg-surface-tertiary);">
              <div style="position:relative; max-height:220px; overflow:hidden; display:flex; justify-content:center; align-items:center; background:#000;">
                <img id="snap-image-preview" src="" alt="Document Preview" style="max-width:100%; max-height:220px; object-fit:contain;">
              </div>
              <div style="padding:10px 14px; display:flex; justify-content:space-between; align-items:center; background:#fff;">
                <div>
                  <strong id="snap-preview-name" style="font-size:12px; display:block; color:var(--meil-navy);">document.jpg</strong>
                  <span id="snap-preview-meta" style="font-size:11px; color:var(--text-muted);">Image Preview</span>
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('snap-file-input').click()">
                    Replace
                  </button>
                  <button type="button" class="btn btn-sm btn-outline" style="color:var(--color-danger);" onclick="snapToBrsrModule.clearSelectedFile()">
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Button: Run Extraction -->
            <div style="margin-top:16px;">
              <button id="snap-btn-analyze" class="btn btn-primary" style="width:100%;" onclick="snapToBrsrModule.runExtraction()">
                <i data-lucide="sparkles"></i>
                <span>Extract Document Information</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Column 2: Editable Extracted Fields & Review -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="card-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="file-check-2" style="color:var(--color-success);"></i>
              <span>Step 2: Extracted Information &amp; Review</span>
            </div>
            <span id="snap-status-badge" class="badge badge-secondary">Awaiting Document</span>
          </div>
          <div class="card-body">
            <!-- Initial Empty State -->
            <div id="snap-empty-state" style="text-align:center; padding:40px 16px; color:var(--text-muted);">
              <i data-lucide="scan" style="width:48px; height:48px; stroke-width:1.5; margin-bottom:12px; opacity:0.35;"></i>
              <p style="font-size:13px; margin-bottom:8px;">Upload a bill or select a demo sample to view extracted fields, confidence indicators, and statutory BRSR emissions mapping.</p>
              <span style="font-size:11px; color:var(--text-muted);">Demonstration engine clearly indicates simulated values vs manual verification.</span>
            </div>

            <!-- Active Extracted Form Container -->
            <div id="snap-form-container" style="display:none;">
              <!-- Confidence Indicator Bar (Requirement: labeled appropriately) -->
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-surface-secondary); border-radius:6px; margin-bottom:14px; border:1px solid var(--border-light); font-size:11px;">
                <div>
                  <span style="color:var(--text-muted);">Extraction Engine:</span>
                  <strong style="color:var(--meil-navy);" id="snap-engine-label">Simulated Extraction Demonstration</strong>
                </div>
                <div style="text-align:right;">
                  <span style="color:var(--text-muted);">Confidence Indicator:</span>
                  <strong style="color:var(--color-success);" id="snap-confidence-label">94.6% (Simulated Metric)</strong>
                </div>
              </div>

              <!-- Validation Message Banner -->
              <div id="snap-validation-alert" class="alert alert-warning" style="display:none; margin-bottom:14px; font-size:12px;"></div>

              <!-- Editable Form Fields -->
              <form id="snap-review-form" onsubmit="event.preventDefault(); snapToBrsrModule.submitRecord('official');">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Document Type *</label>
                    <select id="snap-doc-type" class="form-control" onchange="snapToBrsrModule.onDocTypeChanged(this.value)">
                      <option value="Diesel Bill">Diesel Bill</option>
                      <option value="Electricity Bill">Electricity Bill</option>
                      <option value="Weighbridge Slip">Weighbridge Slip</option>
                      <option value="Meter Photograph">Meter Photograph</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Fuel / Energy / Item Type *</label>
                    <input type="text" id="snap-fuel-type" class="form-control" placeholder="e.g., High-Speed Diesel" required oninput="snapToBrsrModule.recalculateEmissions()">
                  </div>
                </div>

                <!-- Custom Document Type Field (Visible ONLY when Other is selected) -->
                <div id="snap-custom-type-group" class="form-group" style="display:none; margin-bottom:10px; background:#fffbeb; padding:10px; border-radius:6px; border:1px solid #fde68a;">
                  <label class="form-label" style="font-size:11px; font-weight:700; color:#92400e;">
                    Specify Document Type <span class="required" style="color:#b91c1c;">*</span>
                  </label>
                  <input type="text" id="snap-custom-doc-type" class="form-control" placeholder="E.g., Water Bill, Waste Disposal Receipt, Travel Expense Receipt, Maintenance Invoice">
                  <span style="font-size:10px; color:#b45309; display:block; margin-top:2px;">
                    Please provide an accurate description for review and audit verification.
                  </span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Quantity *</label>
                    <input type="number" step="any" id="snap-quantity" class="form-control" placeholder="e.g., 1000" required oninput="snapToBrsrModule.recalculateEmissions()">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Unit of Measurement *</label>
                    <select id="snap-unit" class="form-control" onchange="snapToBrsrModule.onUnitChanged(this.value)">
                      <option value="Litres">Litres (L)</option>
                      <option value="kWh">kWh (Units)</option>
                      <option value="MWh">MWh</option>
                      <option value="Tonnes">Tonnes (MT)</option>
                      <option value="kL">Kilolitres (kL)</option>
                      <option value="Units">Units / Nos</option>
                      <option value="Trips">Trips / Loads</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <!-- Custom Unit of Measurement Field (Visible ONLY when Other is selected) -->
                <div id="snap-custom-unit-group" class="form-group" style="display:none; margin-bottom:10px; background:#fffbeb; padding:10px; border-radius:6px; border:1px solid #fde68a;">
                  <label class="form-label" style="font-size:11px; font-weight:700; color:#92400e;">
                    Specify Unit of Measurement <span class="required" style="color:#b91c1c;">*</span>
                  </label>
                  <input type="text" id="snap-custom-unit" class="form-control" placeholder="E.g., cubic metres (m³), kilograms (kg), tonnes (t), barrels" oninput="snapToBrsrModule.recalculateEmissions()">
                  <span style="font-size:10px; color:#b45309; display:block; margin-top:2px;">
                    Please enter the specific unit of measurement for operational record.
                  </span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Document / Invoice Date *</label>
                    <input type="date" id="snap-date" class="form-control" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px; font-weight:600;">Vendor / Supplier *</label>
                    <input type="text" id="snap-vendor" class="form-control" placeholder="e.g., Indian Oil Corp Ltd" required>
                  </div>
                </div>

                <!-- BRSR Mapping & Scope 1 / Scope 2 Emissions Display -->
                <div style="padding:12px 14px; border-radius:var(--radius-md); background:var(--bg-surface-secondary); border:1px solid var(--border-medium); margin-bottom:16px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:11px; font-weight:700; color:var(--meil-navy); text-transform:uppercase;">BRSR Indicator Mapping</span>
                    <span id="snap-scope-badge" class="badge badge-primary">Scope 1 Direct</span>
                  </div>
                  <div id="snap-mapping-desc" style="font-size:12px; color:var(--text-primary); margin-bottom:8px;">
                    Principle 6 (P6-E1): Direct Fuel Combustion Disclosures
                  </div>
                  
                  <!-- Formula, Inputs, Factor, and Result -->
                  <div style="border-top:1px solid var(--border-light); padding-top:8px; font-size:11px; color:var(--text-secondary); line-height:1.5;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                      <span>Emission Factor Applied:</span>
                      <strong id="snap-factor-label" style="color:var(--meil-navy);">2.68 kg CO2e / Litre (Sample Baseline)</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                      <span>Calculation Formula:</span>
                      <span id="snap-formula-label" style="font-family:monospace; color:var(--text-primary);">Quantity × Emission Factor</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:4px; border-top:1px solid var(--border-light);">
                      <strong style="color:var(--text-primary); font-size:12px;">Calculated Result:</strong>
                      <strong id="snap-result-label" style="font-size:14px; color:var(--color-success);">0.00 tCO2e (0 kg)</strong>
                    </div>
                  </div>
                </div>

                <!-- Submission Actions (Save Draft vs Submit) -->
                <div style="display:flex; gap:10px;">
                  <button type="button" class="btn btn-outline" style="flex:1;" onclick="snapToBrsrModule.submitRecord('draft')">
                    <i data-lucide="save"></i> Save Draft
                  </button>
                  <button type="submit" class="btn btn-brand-red" style="flex:1;" id="snap-btn-submit-main">
                    <i data-lucide="send"></i> Submit to BRSR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence & Verification Register -->
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title" style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="folder-check" style="color:var(--meil-navy);"></i>
            <span>My Subsidiary Evidence &amp; Submission Register</span>
          </div>
          <span class="badge badge-secondary" id="snapRegisterCount">${this.getMySubsidiaryEvidence().length} Records Registered</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Document Name / Date</th>
                  <th>Related Project</th>
                  <th>Document Type &amp; Details</th>
                  <th>Quantity / Energy</th>
                  <th>Calculated Emissions</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="snapEvidenceTableBody">
                ${this.renderEvidenceTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // Handle local file selection with compressed Base64 representation for persistent sharing
  handleFileSelected(files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      ui.showToast('Please select a valid image file (JPG, JPEG, PNG, WEBP).', 'warning');
      return;
    }

    this.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const originalDataUrl = e.target.result;
      
      // Compress image onto a standard offscreen canvas to keep localStorage lightweight (< 200KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Quality 0.7 JPEG data URL for permanent cross-role storage
        this.uploadedFilePreviewUrl = canvas.toDataURL('image/jpeg', 0.7);

        const previewCont = document.getElementById('snap-preview-container');
        const imgEl = document.getElementById('snap-image-preview');
        const nameEl = document.getElementById('snap-preview-name');
        const metaEl = document.getElementById('snap-preview-meta');

        if (previewCont) previewCont.style.display = 'block';
        if (imgEl) imgEl.src = this.uploadedFilePreviewUrl;
        if (nameEl) nameEl.textContent = file.name;
        if (metaEl) metaEl.textContent = `${(file.size / 1024).toFixed(1)} KB • Image Evidence Ready`;
        if (window.lucide) lucide.createIcons();
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  }

  clearSelectedFile() {
    this.uploadedFile = null;
    this.uploadedFilePreviewUrl = null;
    const fileInput = document.getElementById('snap-file-input');
    if (fileInput) fileInput.value = '';
    const previewCont = document.getElementById('snap-preview-container');
    if (previewCont) previewCont.style.display = 'none';
  }

  // Load Demonstration Samples
  loadDemoSample(type) {
    let sample = {
      name: 'Diesel_Invoice_Sample.jpg',
      docType: 'Diesel Bill',
      customDocType: null,
      fuelType: 'High-Speed Diesel',
      quantity: 1000,
      unit: 'Litres',
      date: new Date().toISOString().slice(0, 10),
      vendor: 'Indian Oil Corporation Ltd (Commercial Depot)',
      confidence: 94.6,
      previewSvg: this.createSampleSvg('DIESEL FUEL INVOICE', '1,000 LITRES • ₹92,500')
    };

    if (type === 'electricity') {
      sample = {
        name: 'TSSPDCL_HT_Electricity_Bill.jpg',
        docType: 'Electricity Bill',
        customDocType: null,
        fuelType: 'Grid Electricity',
        quantity: 14500,
        unit: 'kWh',
        date: new Date().toISOString().slice(0, 10),
        vendor: 'Telangana State Southern Power Distribution Co.',
        confidence: 96.2,
        previewSvg: this.createSampleSvg('ELECTRICITY HT BILL', '14,500 kWh • ₹1,21,800')
      };
    } else if (type === 'weighbridge') {
      sample = {
        name: 'Weighbridge_Slip_FlyAsh_Cement.jpg',
        docType: 'Weighbridge Slip',
        customDocType: null,
        fuelType: 'Fly-Ash Blended Cement (PPC)',
        quantity: 250,
        unit: 'Tonnes',
        date: new Date().toISOString().slice(0, 10),
        vendor: 'UltraTech Cement / ReadyMix Dispatch',
        confidence: 92.4,
        previewSvg: this.createSampleSvg('WEIGHBRIDGE SLIP', 'GROSS: 42.5 MT • NET: 25.0 MT')
      };
    } else if (type === 'meter') {
      sample = {
        name: 'Diesel_Genset_Meter_Photo.jpg',
        docType: 'Meter Photograph',
        customDocType: null,
        fuelType: 'Generator Diesel Flow Meter',
        quantity: 450,
        unit: 'Litres',
        date: new Date().toISOString().slice(0, 10),
        vendor: 'Site Fuel Dispenser Unit #04',
        confidence: 88.4,
        previewSvg: this.createSampleSvg('DIGITAL FLOW METER', 'METER READING: 00450.0 L')
      };
    }

    this.uploadedFile = { name: sample.name, size: 245000 };
    this.uploadedFilePreviewUrl = sample.previewSvg;

    const previewCont = document.getElementById('snap-preview-container');
    const imgEl = document.getElementById('snap-image-preview');
    const nameEl = document.getElementById('snap-preview-name');
    const metaEl = document.getElementById('snap-preview-meta');

    if (previewCont) previewCont.style.display = 'block';
    if (imgEl) imgEl.src = sample.previewSvg;
    if (nameEl) nameEl.textContent = sample.name;
    if (metaEl) metaEl.textContent = 'Demonstration Bill Preview';

    this.populateExtractedFields(sample);
    ui.showToast(`Loaded demonstration ${sample.docType}. Values clearly identified for review.`, 'info');
  }

  createSampleSvg(title, subtitle) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
        <rect width="400" height="220" fill="#0f172a"/>
        <rect x="15" y="15" width="370" height="190" fill="#1e293b" rx="8" stroke="#334155" stroke-width="2"/>
        <text x="200" y="60" fill="#38bdf8" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${title}</text>
        <line x1="40" y1="80" x2="360" y2="80" stroke="#475569" stroke-width="1"/>
        <text x="200" y="115" fill="#f8fafc" font-size="14" font-family="monospace" text-anchor="middle">${subtitle}</text>
        <rect x="60" y="145" width="280" height="30" fill="#0b2545" rx="4" stroke="#0284c7"/>
        <text x="200" y="165" fill="#93c5fd" font-size="11" font-family="sans-serif" text-anchor="middle">DEMONSTRATION EVIDENCE ATTACHMENT</text>
      </svg>
    `;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  runExtraction() {
    if (!this.uploadedFile && !this.uploadedFilePreviewUrl) {
      ui.showToast('Please upload an image or select a demo bill first.', 'warning');
      return;
    }

    const btn = document.getElementById('snap-btn-analyze');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Extracting Fields...`;
      if (window.lucide) lucide.createIcons();
    }

    setTimeout(() => {
      const fileName = this.uploadedFile?.name || 'Uploaded_Bill.jpg';
      const isElec = fileName.toLowerCase().includes('elec') || fileName.toLowerCase().includes('power');
      const isMeter = fileName.toLowerCase().includes('meter');
      const isWeigh = fileName.toLowerCase().includes('weigh') || fileName.toLowerCase().includes('cement');

      const sample = {
        name: fileName,
        docType: isElec ? 'Electricity Bill' : (isMeter ? 'Meter Photograph' : (isWeigh ? 'Weighbridge Slip' : 'Diesel Bill')),
        customDocType: null,
        fuelType: isElec ? 'Grid Electricity' : (isWeigh ? 'Raw Material Cement' : 'High-Speed Diesel'),
        quantity: isElec ? 8500 : (isMeter ? 450 : (isWeigh ? 250 : 1200)),
        unit: isElec ? 'kWh' : (isWeigh ? 'Tonnes' : 'Litres'),
        date: new Date().toISOString().slice(0, 10),
        vendor: isElec ? 'State Electricity Distribution Co.' : (isWeigh ? 'ReadyMix Concrete Suppliers' : 'Commercial Fuel Supplier'),
        confidence: isElec ? 95.8 : 94.2
      };

      this.populateExtractedFields(sample);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles"></i> <span>Extract Document Information</span>`;
        if (window.lucide) lucide.createIcons();
      }

      ui.showToast('Simulated extraction complete. Please review and verify all fields below.', 'success');
    }, 400);
  }

  populateExtractedFields(data) {
    const emptyState = document.getElementById('snap-empty-state');
    const formContainer = document.getElementById('snap-form-container');
    const statusBadge = document.getElementById('snap-status-badge');

    if (emptyState) emptyState.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';
    if (statusBadge) {
      statusBadge.className = 'badge badge-approved';
      statusBadge.textContent = 'Extracted (Ready for Review)';
    }

    const docTypeEl = document.getElementById('snap-doc-type');
    const customTypeGroup = document.getElementById('snap-custom-type-group');
    const customTypeInput = document.getElementById('snap-custom-doc-type');
    const fuelTypeEl = document.getElementById('snap-fuel-type');
    const qtyEl = document.getElementById('snap-quantity');
    const unitEl = document.getElementById('snap-unit');
    const customUnitGroup = document.getElementById('snap-custom-unit-group');
    const customUnitInput = document.getElementById('snap-custom-unit');
    const dateEl = document.getElementById('snap-date');
    const vendorEl = document.getElementById('snap-vendor');
    const confLabel = document.getElementById('snap-confidence-label');

    const docType = data.docType || 'Diesel Bill';
    if (docTypeEl) docTypeEl.value = docType;

    if (docType === 'Other') {
      if (customTypeGroup) customTypeGroup.style.display = 'block';
      if (customTypeInput) {
        customTypeInput.value = data.customDocType || '';
        customTypeInput.required = true;
      }
    } else {
      if (customTypeGroup) customTypeGroup.style.display = 'none';
      if (customTypeInput) {
        customTypeInput.value = '';
        customTypeInput.required = false;
      }
    }

    if (fuelTypeEl) fuelTypeEl.value = data.fuelType || 'High-Speed Diesel';
    if (qtyEl) qtyEl.value = data.quantity || 1000;

    const unit = data.unit || 'Litres';
    if (unitEl) unitEl.value = unit;

    if (unit === 'Other') {
      if (customUnitGroup) customUnitGroup.style.display = 'block';
      if (customUnitInput) {
        customUnitInput.value = data.customUnit || '';
        customUnitInput.required = true;
      }
    } else {
      if (customUnitGroup) customUnitGroup.style.display = 'none';
      if (customUnitInput) {
        customUnitInput.value = '';
        customUnitInput.required = false;
      }
    }

    if (dateEl) dateEl.value = data.date || new Date().toISOString().slice(0, 10);
    if (vendorEl) vendorEl.value = data.vendor || 'Indian Oil Corporation Ltd';
    if (confLabel) confLabel.textContent = `${data.confidence || 94.0}% (Simulated Indicator)`;

    this.recalculateEmissions();
    if (window.lucide) lucide.createIcons();
  }

  onDocTypeChanged(docType) {
    const fuelInput = document.getElementById('snap-fuel-type');
    const unitSelect = document.getElementById('snap-unit');
    const customTypeGroup = document.getElementById('snap-custom-type-group');
    const customTypeInput = document.getElementById('snap-custom-doc-type');

    if (docType === 'Other') {
      if (customTypeGroup) customTypeGroup.style.display = 'block';
      if (customTypeInput) {
        customTypeInput.required = true;
        customTypeInput.focus();
      }
      if (fuelInput) fuelInput.placeholder = 'e.g., Water Supply, Municipal Solid Waste, Paper';
    } else {
      if (customTypeGroup) customTypeGroup.style.display = 'none';
      if (customTypeInput) {
        customTypeInput.required = false;
        customTypeInput.value = '';
      }

      if (docType === 'Electricity Bill') {
        if (fuelInput) fuelInput.value = 'Grid Electricity';
        if (unitSelect) { unitSelect.value = 'kWh'; this.onUnitChanged('kWh'); }
      } else if (docType === 'Diesel Bill') {
        if (fuelInput) fuelInput.value = 'High-Speed Diesel';
        if (unitSelect) { unitSelect.value = 'Litres'; this.onUnitChanged('Litres'); }
      } else if (docType === 'Weighbridge Slip') {
        if (fuelInput) fuelInput.value = 'Fly-Ash Blended Cement';
        if (unitSelect) { unitSelect.value = 'Tonnes'; this.onUnitChanged('Tonnes'); }
      } else if (docType === 'Meter Photograph') {
        if (fuelInput) fuelInput.value = 'Generator Diesel Flow Meter';
        if (unitSelect) { unitSelect.value = 'Litres'; this.onUnitChanged('Litres'); }
      }
    }
    this.recalculateEmissions();
  }

  onUnitChanged(unitVal) {
    const customUnitGroup = document.getElementById('snap-custom-unit-group');
    const customUnitInput = document.getElementById('snap-custom-unit');

    if (unitVal === 'Other') {
      if (customUnitGroup) customUnitGroup.style.display = 'block';
      if (customUnitInput) {
        customUnitInput.required = true;
        customUnitInput.focus();
      }
    } else {
      if (customUnitGroup) customUnitGroup.style.display = 'none';
      if (customUnitInput) {
        customUnitInput.required = false;
        customUnitInput.value = '';
      }
    }
    this.recalculateEmissions();
  }

  // Emission Calculations based on appropriate document type & category
  recalculateEmissions() {
    const docType = document.getElementById('snap-doc-type')?.value || 'Diesel Bill';
    const fuel = (document.getElementById('snap-fuel-type')?.value || '').toLowerCase();
    const unit = document.getElementById('snap-unit')?.value || 'Litres';
    const customUnit = document.getElementById('snap-custom-unit')?.value?.trim() || 'Custom Unit';
    const qty = parseFloat(document.getElementById('snap-quantity')?.value) || 0;

    const scopeBadge = document.getElementById('snap-scope-badge');
    const mappingDesc = document.getElementById('snap-mapping-desc');
    const factorLabel = document.getElementById('snap-factor-label');
    const formulaLabel = document.getElementById('snap-formula-label');
    const resultLabel = document.getElementById('snap-result-label');

    // Case 0: Other / Custom Unit -> Do NOT automatically convert unknown units or calculate unsupported emissions
    if (unit === 'Other') {
      if (scopeBadge) {
        scopeBadge.className = 'badge badge-secondary';
        scopeBadge.textContent = 'Custom Operational Tracking';
      }
      if (mappingDesc) {
        mappingDesc.textContent = 'Section C / Operational Disclosures: Custom Unit Verification';
      }
      if (factorLabel) {
        factorLabel.textContent = 'N/A (No Standard Emission Factor for Custom Unit)';
      }
      if (formulaLabel) {
        formulaLabel.textContent = `${qty.toLocaleString('en-IN')} ${customUnit} logged without conversion factor`;
      }
      if (resultLabel) {
        resultLabel.textContent = 'Custom Unit (0.00 tCO2e direct)';
      }

      this.currentCalculation = {
        scope: 'Custom Operational Tracking',
        brsrMapping: 'Section C / Operational Disclosures: Custom Unit Verification',
        factor: 'N/A (Custom Unit)',
        formula: `${qty.toLocaleString('en-IN')} ${customUnit} logged without conversion factor`,
        kg: 0,
        mt: 0.0
      };
      return;
    }

    // Case 1: Electricity Bills or kWh/MWh electrical records -> Scope 2
    if (docType === 'Electricity Bill' || fuel.includes('elec') || fuel.includes('power') || unit === 'kWh' || unit === 'MWh') {
      let effectiveKwh = qty;
      if (unit === 'MWh') effectiveKwh = qty * 1000;

      const emissionsKg = effectiveKwh * 0.716;
      const emissionsMt = (emissionsKg / 1000).toFixed(2);

      if (scopeBadge) {
        scopeBadge.className = 'badge badge-primary';
        scopeBadge.textContent = 'Scope 2 Indirect (Purchased Electricity)';
      }
      if (mappingDesc) {
        mappingDesc.textContent = 'Principle 6 (P6-E2): Purchased Grid Electricity Disclosures';
      }
      if (factorLabel) {
        factorLabel.textContent = '0.716 kg CO2e / kWh (Sample CEA Baseline v20)';
      }
      if (formulaLabel) {
        formulaLabel.textContent = `${effectiveKwh.toLocaleString('en-IN')} kWh × 0.716 kg CO2e/kWh = ${Math.round(emissionsKg).toLocaleString('en-IN')} kg`;
      }
      if (resultLabel) {
        resultLabel.textContent = `${emissionsMt} tCO2e (${Math.round(emissionsKg).toLocaleString('en-IN')} kg)`;
      }

      this.currentCalculation = {
        scope: 'Scope 2 Indirect',
        brsrMapping: 'Principle 6 (P6-E2): Purchased Grid Electricity Disclosures',
        factor: '0.716 kg CO2e / kWh (Sample CEA Baseline v20)',
        formula: `${effectiveKwh.toLocaleString('en-IN')} kWh × 0.716 kg CO2e/kWh = ${Math.round(emissionsKg).toLocaleString('en-IN')} kg (${emissionsMt} tCO2e)`,
        kg: Math.round(emissionsKg),
        mt: Number(emissionsMt)
      };
      return;
    }

    // Case 2: Supported Diesel / Liquid Fuel Combustion -> Scope 1
    if (docType === 'Diesel Bill' || fuel.includes('diesel') || fuel.includes('petrol') || fuel.includes('fuel') || (docType === 'Meter Photograph' && fuel.includes('diesel'))) {
      let effectiveLitres = qty;
      if (unit === 'kL') effectiveLitres = qty * 1000;

      const emissionsKg = effectiveLitres * 2.68;
      const emissionsMt = (emissionsKg / 1000).toFixed(2);

      if (scopeBadge) {
        scopeBadge.className = 'badge badge-danger';
        scopeBadge.textContent = 'Scope 1 Direct (Fuel Combustion)';
      }
      if (mappingDesc) {
        mappingDesc.textContent = 'Principle 6 (P6-E1): Direct Fuel Combustion Disclosures';
      }
      if (factorLabel) {
        factorLabel.textContent = '2.68 kg CO2e / Litre (Sample SEBI Core Baseline)';
      }
      if (formulaLabel) {
        formulaLabel.textContent = `${effectiveLitres.toLocaleString('en-IN')} Litres × 2.68 kg CO2e/L = ${Math.round(emissionsKg).toLocaleString('en-IN')} kg`;
      }
      if (resultLabel) {
        resultLabel.textContent = `${emissionsMt} tCO2e (${Math.round(emissionsKg).toLocaleString('en-IN')} kg)`;
      }

      this.currentCalculation = {
        scope: 'Scope 1 Direct',
        brsrMapping: 'Principle 6 (P6-E1): Direct Fuel Combustion Disclosures',
        factor: '2.68 kg CO2e / Litre (Sample SEBI Core Baseline)',
        formula: `${effectiveLitres.toLocaleString('en-IN')} Litres × 2.68 kg CO2e/L = ${Math.round(emissionsKg).toLocaleString('en-IN')} kg (${emissionsMt} tCO2e)`,
        kg: Math.round(emissionsKg),
        mt: Number(emissionsMt)
      };
      return;
    }

    // Case 3: Weighbridge slips (Materials & circularity accounting)
    if (docType === 'Weighbridge Slip') {
      if (scopeBadge) {
        scopeBadge.className = 'badge badge-secondary';
        scopeBadge.textContent = 'Operational Material / Circularity Record';
      }
      if (mappingDesc) {
        mappingDesc.textContent = 'Principle 6 (P6-E4): Sourced Construction Material & Waste Inventory Disclosures';
      }
      if (factorLabel) {
        factorLabel.textContent = 'Material Mass Tracking (Scope 3 GHG Withheld)';
      }
      if (formulaLabel) {
        formulaLabel.textContent = `${qty.toLocaleString('en-IN')} ${unit} logged as verified site weight slip`;
      }
      if (resultLabel) {
        resultLabel.textContent = 'Material Tracked (0.00 tCO2e direct)';
      }

      this.currentCalculation = {
        scope: 'Material & Circularity Accounting',
        brsrMapping: 'Principle 6 (P6-E4): Sourced Construction Material Disclosures',
        factor: 'Material Mass Tracking (Scope 3 GHG Withheld)',
        formula: `${qty.toLocaleString('en-IN')} ${unit} logged as verified site weight slip`,
        kg: 0,
        mt: 0.0
      };
      return;
    }

    // Case 4: Other Documents or Non-fuel items
    if (scopeBadge) {
      scopeBadge.className = 'badge badge-secondary';
      scopeBadge.textContent = 'General Supporting Evidence (Non-Combustion)';
    }
    if (mappingDesc) {
      mappingDesc.textContent = 'Section C / Auxiliary Disclosures: Operational Expense & Resource Evidence';
    }
    if (factorLabel) {
      factorLabel.textContent = 'No Direct Combustion Factor Applicable';
    }
    if (formulaLabel) {
      formulaLabel.textContent = 'Filing logged as auxiliary ESG statutory verification record';
    }
    if (resultLabel) {
      resultLabel.textContent = 'N/A (Non-Emissions Document)';
    }

    this.currentCalculation = {
      scope: 'General Supporting Evidence',
      brsrMapping: 'Auxiliary Disclosures: Operational & Resource Evidence',
      factor: 'N/A',
      formula: 'Filing logged as auxiliary ESG statutory verification record',
      kg: 0,
      mt: 0.0
    };
  }

  // Validate fields before submission
  validateFields() {
    const docType = document.getElementById('snap-doc-type')?.value;
    const customType = document.getElementById('snap-custom-doc-type')?.value?.trim();
    const unit = document.getElementById('snap-unit')?.value;
    const customUnit = document.getElementById('snap-custom-unit')?.value?.trim();
    const fuel = document.getElementById('snap-fuel-type')?.value?.trim();
    const qty = parseFloat(document.getElementById('snap-quantity')?.value);
    const date = document.getElementById('snap-date')?.value?.trim();
    const vendor = document.getElementById('snap-vendor')?.value?.trim();
    const alertEl = document.getElementById('snap-validation-alert');

    const issues = [];
    if (!docType) issues.push('Document type is required.');

    // Validate custom type when Other is selected
    if (docType === 'Other') {
      if (!customType) {
        issues.push('Please specify the document description under "Specify Document Type".');
      }
    }

    if (!unit) issues.push('Unit of measurement is required.');

    // Validate custom unit when Other is selected
    if (unit === 'Other') {
      if (!customUnit) {
        issues.push('Please specify the unit under "Specify Unit of Measurement".');
      }
    }

    if (!fuel) issues.push('Fuel / Energy / Item type is required.');
    if (isNaN(qty) || qty <= 0) issues.push('Quantity must be a positive number.');
    if (!date) issues.push('Document date is required.');
    if (!vendor) issues.push('Vendor / Supplier name is required.');

    if (issues.length > 0) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerHTML = `<i data-lucide="alert-circle"></i> <strong>Validation Notice:</strong> ${issues.join(' ')}`;
        if (window.lucide) lucide.createIcons();
      }
      return false;
    }

    if (alertEl) alertEl.style.display = 'none';
    return true;
  }

  // Submit Evidence Record (Draft vs Official Submission)
  submitRecord(mode = 'official') {
    if (!this.validateFields()) return;

    // Prevent duplicate rapid submissions
    const submitBtn = document.getElementById('snap-btn-submit-main');
    if (submitBtn) submitBtn.disabled = true;

    const activeSubId = auth.getActiveSubsidiaryId();
    const activeSub = auth.getActiveSubsidiary();

    const buId = document.getElementById('snap-bu-select')?.value || this.selectedBuId;
    const bu = store.getBusinessUnitById(buId);

    const projId = document.getElementById('snap-project-select')?.value || this.selectedProjectId;
    const proj = store.getProjectById(projId);

    const docType = document.getElementById('snap-doc-type')?.value;
    const customDocType = docType === 'Other' ? (document.getElementById('snap-custom-doc-type')?.value?.trim() || 'Other Document') : null;
    const fuelType = document.getElementById('snap-fuel-type')?.value;
    const quantity = parseFloat(document.getElementById('snap-quantity')?.value) || 0;
    const unit = document.getElementById('snap-unit')?.value;
    const customUnit = unit === 'Other' ? (document.getElementById('snap-custom-unit')?.value?.trim() || 'Custom Unit') : null;
    const docDate = document.getElementById('snap-date')?.value;
    const vendor = document.getElementById('snap-vendor')?.value;

    this.recalculateEmissions();
    const calc = this.currentCalculation || {
      scope: 'General Supporting Evidence',
      brsrMapping: 'Auxiliary Disclosures',
      factor: 'N/A',
      formula: 'Direct Record',
      kg: 0,
      mt: 0.0
    };

    const recordId = this.editingRecordId || `EV-${activeSub?.shortName?.slice(0,3)?.toUpperCase() || 'SUB'}-${Date.now().toString().slice(-4)}`;

    const newEvidenceRecord = {
      id: recordId,
      subsidiaryId: activeSubId,
      subsidiaryName: activeSub?.name || 'Assigned Subsidiary',
      businessUnitId: buId || null,
      businessUnitName: bu?.name || 'Assigned Business Unit',
      businessUnitCode: bu?.code || '',
      projectId: projId,
      projectName: proj?.name || 'Assigned Project',
      projectCode: proj?.code || 'PRJ-SITE',
      documentName: this.uploadedFile?.name || `${(customDocType || docType).replace(/\s+/g, '_')}_${docDate}.jpg`,
      documentDate: docDate,
      documentType: docType,
      customDocumentType: customDocType,
      fuelType: fuelType,
      quantity: quantity,
      unit: unit,
      customUnit: customUnit,
      vendor: vendor,
      totalCostInr: null,
      scope: calc.scope,
      brsrMapping: calc.brsrMapping,
      calculatedEmissionsKg: calc.kg,
      calculatedEmissionsMt: calc.mt,
      emissionFactorUsed: calc.factor,
      formula: calc.formula,
      status: mode === 'draft' ? 'Draft' : 'Submitted',
      approvalStatus: mode === 'draft' ? 'Draft' : 'Pending Review',
      submissionTimestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      confidenceScore: 95.0,
      isSimulatedExtraction: true,
      reviewerNotes: null,
      reviewerDate: null,
      reviewerName: null,
      imageDataUrl: this.uploadedFilePreviewUrl || null
    };

    // Save directly to shared store state (shared across Main Admin and Sub Admin)
    store.saveSnapEvidenceRecord(newEvidenceRecord);
    this.editingRecordId = null;

    // Link directly to Project ESG disclosures in store if emissions apply
    if (proj && mode === 'official' && calc.mt > 0) {
      if (!proj.environment) proj.environment = {};
      if (calc.scope.includes('Scope 1')) {
        proj.environment.scope1 = Number(proj.environment.scope1 || 0) + calc.mt;
        proj.environment.fuelConsumptionKL = Number(proj.environment.fuelConsumptionKL || 0) + (quantity / 1000);
      } else if (calc.scope.includes('Scope 2')) {
        proj.environment.scope2 = Number(proj.environment.scope2 || 0) + calc.mt;
        proj.environment.electricityConsumptionMWh = Number(proj.environment.electricityConsumptionMWh || 0) + (quantity / 1000);
      }
      store.saveState();
    }

    // Add notification to Main Admin
    if (mode === 'official') {
      store.addNotification({
        role: 'main_admin',
        subsidiaryId: activeSubId,
        type: 'submission',
        title: `New Evidence Submitted: ${newEvidenceRecord.id}`,
        desc: `${activeSub?.name} submitted ${newEvidenceRecord.documentType}${newEvidenceRecord.customDocumentType ? ` (${newEvidenceRecord.customDocumentType})` : ''} for BU ${newEvidenceRecord.businessUnitName}. Ready for review.`,
        icon: 'FileCheck',
        color: 'info'
      });
    }

    // Add central audit log
    store.addAuditLog(
      auth.getUserInfo().name,
      mode === 'draft' ? 'SNAP_DRAFT_SAVED' : 'SNAP_EVIDENCE_SUBMITTED',
      `${mode === 'draft' ? 'Saved draft' : 'Submitted'} Snap-to-BRSR evidence ${newEvidenceRecord.id} [${docType}${customDocType ? ` - ${customDocType}` : ''}] (${quantity} ${customUnit || unit}) for ${proj?.name || 'Project'}`
    );


    // Refresh Evidence Table in DOM
    const tbody = document.getElementById('snapEvidenceTableBody');
    const countBadge = document.getElementById('snapRegisterCount');
    if (tbody) tbody.innerHTML = this.renderEvidenceTableRows();
    if (countBadge) {
      const myCount = this.getMySubsidiaryEvidence().length;
      countBadge.textContent = `${myCount} Records Registered`;
    }

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
    }, 1000);

    ui.showToast(
      mode === 'draft' 
        ? 'Draft evidence record saved locally.' 
        : `Evidence ${newEvidenceRecord.id} successfully submitted and forwarded to Main Admin for review!`,
      'success'
    );

    if (window.lucide) lucide.createIcons();
  }

  // Reopen and edit existing evidence filing (preserves attached evidence)
  editRecord(evidenceId) {
    const record = store.getSnapEvidenceById(evidenceId);
    if (!record) return;

    this.editingRecordId = record.id;
    this.uploadedFile = { name: record.documentName, size: 240000 };
    this.uploadedFilePreviewUrl = record.imageDataUrl;
    this.selectedBuId = record.businessUnitId || null;
    this.selectedProjectId = record.projectId || null;

    // Display image preview
    const previewCont = document.getElementById('snap-preview-container');
    const imgEl = document.getElementById('snap-image-preview');
    const nameEl = document.getElementById('snap-preview-name');
    const metaEl = document.getElementById('snap-preview-meta');

    if (previewCont) previewCont.style.display = 'block';
    if (imgEl && record.imageDataUrl) imgEl.src = record.imageDataUrl;
    if (nameEl) nameEl.textContent = record.documentName;
    if (metaEl) metaEl.textContent = 'Existing Evidence Preserved';

    // Set Business Unit & Project
    if (record.businessUnitId) {
      const buSelect = document.getElementById('snap-bu-select');
      if (buSelect) {
        buSelect.value = record.businessUnitId;
        this.onBusinessUnitChanged(record.businessUnitId);
      }
    }
    if (record.projectId) {
      const projSelect = document.getElementById('snap-project-select');
      if (projSelect) projSelect.value = record.projectId;
    }

    // Populate extracted form fields
    this.populateExtractedFields({
      docType: record.documentType,
      customDocType: record.customDocumentType,
      fuelType: record.fuelType,
      quantity: record.quantity,
      unit: record.unit,
      customUnit: record.customUnit,
      date: record.documentDate,
      vendor: record.vendor,
      confidence: record.confidenceScore || 95.0
    });

    const submitBtn = document.getElementById('snap-btn-submit-main');
    if (submitBtn) {
      submitBtn.innerHTML = `<i data-lucide="send"></i> Update &amp; Resubmit Evidence (${record.id})`;
      if (window.lucide) lucide.createIcons();
    }

    window.scrollTo({ top: 120, behavior: 'smooth' });
    ui.showToast(`Loaded evidence filing ${record.id} for revision. Existing attached evidence preserved.`, 'info');
  }

  renderEvidenceTableRows() {
    const records = this.getMySubsidiaryEvidence();
    if (records.length === 0) {
      return `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No evidence records uploaded for this subsidiary yet.</td></tr>`;
    }

    return records.map(r => `
      <tr>
        <td><strong style="color:var(--meil-navy); font-family:monospace;">${r.id}</strong></td>
        <td>
          <strong style="display:block; color:var(--text-primary); font-size:12px;">${r.documentName}</strong>
          <span style="font-size:11px; color:var(--text-muted);">Date: ${r.documentDate}</span>
        </td>
        <td>
          <span style="font-weight:600; color:var(--meil-navy);">${r.businessUnitName || 'Assigned BU'}</span>
          <span style="display:block; font-size:11px; color:var(--text-muted);">${r.projectName} (${r.projectCode || 'SITE'})</span>
        </td>
        <td>
          <span class="badge badge-secondary" style="font-size:10px;">${r.documentType}</span>
          ${r.customDocumentType ? `<div style="font-size:11px; font-weight:600; color:#92400e; margin-top:2px;">"${r.customDocumentType}"</div>` : ''}
          <div style="font-size:10px; color:var(--text-muted);">${r.vendor}</div>
        </td>
        <td>
          <strong>${r.quantity?.toLocaleString('en-IN')} ${r.unit === 'Other' && r.customUnit ? `${r.customUnit}` : r.unit}</strong>
          ${r.unit === 'Other' ? `<span style="display:block; font-size:10px; color:#92400e; font-weight:600;">(Custom: ${r.customUnit})</span>` : ''}
          <span style="display:block; font-size:11px; color:var(--text-muted);">${r.fuelType}</span>
        </td>
        <td>
          <strong style="color:${r.calculatedEmissionsMt > 0 ? 'var(--color-success)' : 'var(--text-muted)'}; font-size:13px;">
            ${r.calculatedEmissionsMt > 0 ? `${r.calculatedEmissionsMt} tCO2e` : 'N/A'}
          </strong>
          <span style="display:block; font-size:10px; color:var(--text-muted);">${r.scope}</span>
        </td>
        <td>
          <span class="badge ${r.status === 'Approved' ? 'badge-approved' : (r.status === 'Submitted' ? 'badge-submitted' : (r.status === 'Correction Required' ? 'badge-correction' : (r.status === 'Rejected' ? 'badge-danger' : 'badge-draft')))}">
            ${r.status}
          </span>
          ${r.reviewerNotes ? `<span style="display:block; font-size:10px; color:var(--text-muted); max-width:140px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.reviewerNotes}">Notes: ${r.reviewerNotes}</span>` : ''}
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="snapToBrsrModule.viewEvidenceAudit('${r.id}')" title="Audit Evidence Details">
              <i data-lucide="eye"></i> Audit
            </button>
            <button class="btn btn-sm btn-outline" onclick="snapToBrsrModule.editRecord('${r.id}')" title="Edit / Revise Record">
              <i data-lucide="edit-3"></i> Edit
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Modal to Audit Evidence Record Details
  viewEvidenceAudit(evidenceId) {
    const record = store.getSnapEvidenceById(evidenceId);
    if (!record) return;

    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-dialog-content');
    if (!modalBackdrop || !modalContent) return;

    modalContent.innerHTML = `
      <div class="modal-dialog" style="max-width:720px;">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="file-check" style="color:var(--color-success);"></i>
              Evidence Record Audit: ${record.id}
            </h2>
            <span style="font-size:11px; color:var(--text-muted);">Subsidiary: ${record.subsidiaryName} • BU: ${record.businessUnitName || 'N/A'} • Project: ${record.projectName}</span>
          </div>
          <button class="modal-close-btn" onclick="ui.closeModals()"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <!-- Attached Evidence Viewer -->
          <div style="margin-bottom:16px;">
            <div style="font-size:12px; font-weight:700; color:var(--meil-navy); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
              <span>Attached Document Evidence:</span>
              ${record.imageDataUrl ? `
                <div style="display:flex; gap:6px;">
                  <a href="${record.imageDataUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size:11px; padding:2px 8px;">
                    <i data-lucide="external-link"></i> Open Fullscreen
                  </a>
                  <a href="${record.imageDataUrl}" download="${record.documentName}" class="btn btn-sm btn-outline" style="font-size:11px; padding:2px 8px;">
                    <i data-lucide="download"></i> Download Original
                  </a>
                </div>
              ` : ''}
            </div>
            ${record.imageDataUrl ? `
              <div style="background:#0f172a; padding:12px; border-radius:6px; text-align:center; border:1px solid #334155;">
                <img src="${record.imageDataUrl}" style="max-height:260px; max-width:100%; object-fit:contain; border-radius:4px;" alt="Attached Bill Evidence">
              </div>
              <div style="margin-top:6px; font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between;">
                <span>File: <strong>${record.documentName}</strong></span>
                <span>Date: <strong>${record.documentDate}</strong></span>
              </div>
            ` : `
              <div class="alert alert-danger" style="font-size:12px; padding:12px 14px; display:flex; align-items:center; gap:8px;">
                <i data-lucide="alert-circle"></i>
                <div><strong>Evidence File Missing:</strong> The supporting photo or document attachment could not be retrieved for this record.</div>
              </div>
            `}
          </div>

          <!-- Audit Metadata Table -->
          <table class="data-table" style="font-size:12px; margin-bottom:14px;">
            <tbody>
              <tr><td>Document Name</td><td><strong>${record.documentName}</strong></td></tr>
              <tr><td>Associated Business Unit</td><td><strong>${record.businessUnitName || 'N/A'}</strong> ${record.businessUnitCode ? `(${record.businessUnitCode})` : ''}</td></tr>
              <tr><td>Project Site Location</td><td><strong>${record.projectName}</strong> (${record.projectCode || 'SITE'})</td></tr>
              <tr>
                <td>Document Type</td>
                <td>
                  <strong>${record.documentType}</strong>
                  ${record.customDocumentType ? `<span style="display:inline-block; margin-left:8px; padding:2px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-weight:700;">Description: "${record.customDocumentType}"</span>` : ''}
                </td>
              </tr>
              <tr><td>Vendor / Supplier</td><td><strong>${record.vendor}</strong></td></tr>
              <tr><td>Document Date</td><td><strong>${record.documentDate}</strong></td></tr>
              <tr>
                <td>Quantity &amp; Unit</td>
                <td>
                  <strong>${record.quantity?.toLocaleString()} ${record.unit}</strong>
                  ${record.customUnit ? `<span style="display:inline-block; margin-left:8px; padding:2px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-weight:700;">Custom Unit: "${record.customUnit}"</span>` : ''}
                </td>
              </tr>
              <tr><td>Statutory BRSR Mapping</td><td><strong>${record.brsrMapping}</strong></td></tr>
              <tr><td>Emission Factor Used</td><td><strong>${record.emissionFactorUsed}</strong></td></tr>
              <tr><td>Formula Applied</td><td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${record.formula}</code></td></tr>
              <tr>
                <td>Calculated Emissions</td>
                <td>
                  <strong style="color:${record.calculatedEmissionsMt > 0 ? 'var(--color-success)' : 'var(--text-muted)'}; font-size:13px;">
                    ${record.calculatedEmissionsMt > 0 ? `${record.calculatedEmissionsMt} tCO2e (${record.calculatedEmissionsKg?.toLocaleString()} kg)` : 'N/A (Non-Combustion / Custom Unit)'}
                  </strong>
                </td>
              </tr>
              <tr><td>Current Status</td><td><span class="badge ${record.status === 'Approved' ? 'badge-approved' : (record.status === 'Submitted' ? 'badge-submitted' : 'badge-correction')}">${record.status}</span></td></tr>
              ${record.reviewerNotes ? `<tr><td>Reviewer Remarks</td><td style="color:#b91c1c;"><strong>${record.reviewerNotes}</strong> (by ${record.reviewerName || 'Main Admin'}, ${record.reviewerDate})</td></tr>` : ''}
            </tbody>
          </table>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="ui.closeModals(); snapToBrsrModule.editRecord('${record.id}');">
              <i data-lucide="edit-3"></i> Edit / Reopen Filing
            </button>
            <button class="btn btn-secondary" onclick="ui.closeModals()">Close</button>
          </div>
        </div>
      </div>
    `;

    modalBackdrop.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }
}

// Global Singleton Instance
const snapToBrsrModule = new SnapToBrsrModule();
