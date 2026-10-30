<!-- Approved section: Automation. -->
<template>
  <section class="automation-section" id="automation" data-pen-name="Automation">
    <div class="container">
      <div class="section-top" data-reveal>
        <div>
          <p class="section-index">07 / References that follow the structure</p>
          <h2>Stop chasing page numbers.<br>Work from one source of order.</h2>
        </div>
        <p class="lead">The document sequence drives pagination. The numbered structure then supplies index page references and the bookmark hierarchy.</p>
      </div>
      <div class="automation-layout">
        <section class="automation-panel" data-pen-name="Pagination" data-reveal>
          <div class="automation-panel-title">
            <h3><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/></svg>Automated pagination</h3>
            <span class="badge badge-blue">Live example</span>
          </div>
          <div class="automation-panel-content">
            <p class="lead">Add two pages to the affidavit. The downstream document ranges update with the rebuilt example.</p>
            <div class="pagination-range">
              <strong data-collation-total>196</strong>
              <span>numbered document pages<br>in the current bundle</span>
            </div>
            <div class="table-wrap">
              <table class="data-table ">
                <thead>
                  <tr>
                    <th scope="col">Document</th>
                    <th scope="col">Pages</th>
                    <th scope="col">Bundle range</th>
                  </tr>
                </thead>
                <tbody id="pagination-table-body">
                  <tr>
                    <td>Petition</td>
                    <td>18</td>
                    <td>1–18</td>
                  </tr>
                  <tr>
                    <td>Affidavit</td>
                    <td>24</td>
                    <td>19–42</td>
                  </tr>
                  <tr>
                    <td>Agreement</td>
                    <td>39</td>
                    <td>43–81</td>
                  </tr>
                  <tr>
                    <td>Correspondence</td>
                    <td>27</td>
                    <td>82–108</td>
                  </tr>
                  <tr>
                    <td>Evidence</td>
                    <td>52</td>
                    <td>109–160</td>
                  </tr>
                  <tr>
                    <td>Additional records</td>
                    <td>36</td>
                    <td>161–196</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="button button-outline button-small"
              id="pagination-amend"
              type="button"
              aria-pressed="false"
              style="margin-top:18px"
            >
              <span data-toggle-label>Add 2 pages to Affidavit</span>
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v16M4 12h16" />
              </svg>
            </button>
          </div>
        </section>
        <section class="automation-panel" data-pen-name="Index Automation" data-reveal>
          <div class="automation-panel-title">
            <h3><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>The index fills itself</h3>
            <span class="badge badge-blue">Auto-filled pages</span>
          </div>
          <div class="automation-panel-content">
            <p class="lead">Keep the document title and date beside its generated page reference. Review the index before export.</p>
            <div class="table-wrap">
              <table class="data-table index-table">
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Document</th>
                    <th scope="col">Date</th>
                    <th scope="col">Page</th>
                  </tr>
                </thead>
                <tbody id="collation-index-body">
                  <tr>
                    <td>1</td>
                    <td>Petition</td>
                    <td>12 Mar</td>
                    <td>1</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Affidavit</td>
                    <td>13 Mar</td>
                    <td>19</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Agreement</td>
                    <td>14 Mar</td>
                    <td>43</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>Correspondence</td>
                    <td>15 Mar</td>
                    <td>82</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>Evidence</td>
                    <td>16 Mar</td>
                    <td>109</td>
                  </tr>
                  <tr>
                    <td>6</td>
                    <td>Additional records</td>
                    <td>17 Mar</td>
                    <td>161</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="automation-footnote">Page references are calculated from the current document structure. They update when this example is rebuilt.</p>
            <div class="flow-strip">
              <span>Structure</span>
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
              <span>Pagination</span>
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
              <span>Index</span>
            </div>
          </div>
        </section>
      </div>
      <section class="bookmarks-story" data-pen-name="Bookmarking">
        <div class="bookmark-intro" data-reveal>
          <p class="section-index">A navigable final PDF</p>
          <h3 style="margin-top:15px">The index becomes<br>a bookmark hierarchy.</h3>
          <p>Generate bookmarks from the index and document groups. Move documents between parts to update the hierarchy. Add, edit and reorder manual bookmarks with drag-and-drop or arrow controls.</p>
          <div class="bookmark-feature-list">
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>Manual bookmark creation</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/></svg>Automatic and index-based generation</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3"/></svg>Editable order and nested hierarchy</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M13 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 -1)"/></svg>Document groups reflected in the PDF</span>
          </div>
          <div class="flow-strip">
            <span>Index</span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
            <span>Groups</span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
            <span>Hierarchy</span>
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
            <span>Final PDF</span>
          </div>
        </div>
        <div class="bookmark-tree-panel" data-pen-name="Smart Bookmarks" data-reveal>
          <div class="automation-panel-title">
            <h3><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>Structured bookmarks</h3>
            <span class="badge badge-grey">1 → 1a → 1b</span>
          </div>
          <ol class="bookmark-tree" id="collation-bookmarks">
            <li class="bookmark-group">
              <div class="bookmark-group-label">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3h12v18l-6-4-6 4V3Z" />
                </svg>
                <span>1 &nbsp; Core documents</span>
              </div>
              <ol class="bookmark-children">
                <li class="bookmark-leaf">
                  <span>1a &nbsp; Petition</span>
                  <span class="bookmark-page">1</span>
                </li>
                <li class="bookmark-leaf">
                  <span>1b &nbsp; Affidavit</span>
                  <span class="bookmark-page">19</span>
                </li>
              </ol>
            </li>
            <li class="bookmark-group">
              <div class="bookmark-group-label">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3h12v18l-6-4-6 4V3Z" />
                </svg>
                <span>2 &nbsp; Supporting documents</span>
              </div>
              <ol class="bookmark-children">
                <li class="bookmark-leaf">
                  <span>2a &nbsp; Agreement</span>
                  <span class="bookmark-page">43</span>
                </li>
                <li class="bookmark-leaf">
                  <span>2b &nbsp; Correspondence</span>
                  <span class="bookmark-page">82</span>
                </li>
              </ol>
            </li>
            <li class="bookmark-group">
              <div class="bookmark-group-label">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3h12v18l-6-4-6 4V3Z" />
                </svg>
                <span>3 &nbsp; Evidence</span>
              </div>
              <ol class="bookmark-children">
                <li class="bookmark-leaf">
                  <span>3a &nbsp; Evidence</span>
                  <span class="bookmark-page">109</span>
                </li>
              </ol>
            </li>
            <li class="bookmark-group">
              <div class="bookmark-group-label">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3h12v18l-6-4-6 4V3Z" />
                </svg>
                <span>4 &nbsp; Additional material</span>
              </div>
              <ol class="bookmark-children">
                <li class="bookmark-leaf">
                  <span>4a &nbsp; Additional records</span>
                  <span class="bookmark-page">161</span>
                </li>
              </ol>
            </li>
          </ol>
          <div class="bookmark-manual">
            <button class="bookmark-regenerate" type="button" id="bookmark-regenerate"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5"/></svg>Regenerate from the index</button>
            <label for="bookmark-manual-title">Add a manual bookmark to this example</label>
            <div class="bookmark-manual-row">
              <input
                id="bookmark-manual-title"
                maxlength="80"
                value="Supporting note"
                aria-label="Manual bookmark title"
              >
              <input
                id="bookmark-manual-page"
                type="number"
                min="1"
                max="196"
                value="1"
                aria-label="Manual bookmark page"
                style="max-width:62px"
              >
              <button id="bookmark-add" type="button">Add</button>
            </div>
            <ol class="manual-bookmarks" id="manual-bookmarks"></ol>
            <p class="bookmark-status" id="bookmark-status" role="status">Automatic bookmarks follow the four document groups.</p>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
