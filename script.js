document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const fileInput = document.getElementById("file");
    const problemCode = document.getElementById("problem").value.trim();
    const resultsDiv = document.getElementById("results");
  
    if (!fileInput.files.length || !problemCode) {
      alert("Please upload a file and enter a problem code!");
      return;
    }
  
    // Read the Excel file
    const file = fileInput.files[0];
    const reader = new FileReader();
  
    reader.onload = async function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
  
      resultsDiv.innerHTML = "<p>Checking...</p>";
  
      // Initialize table with headers
      let resultsHTML = `
        <table>
          <thead>
            <tr>
              <th>UID</th>
              <th>Name</th>
              <th>Handle</th>
              <th>Solved</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const uid = row["UID"]; // Read UID from Excel
        const name = row["Name"] || row["name"]; // Handle different cases
        const handle = row["Handle"] || row["handle"];
  
        if (!uid || !name || !handle) {
          resultsHTML += `
            <tr>
              <td>${uid || 'Invalid UID'}</td>
              <td>Invalid Row</td>
              <td>Invalid Row</td>
              <td>Invalid</td>
            </tr>
          `;
          continue;
        }
  
        // Fetch user's submission data from Codeforces
        try {
          const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
          const data = await response.json();
  
          if (data.status !== "OK") {
            resultsHTML += `
              <tr>
                <td>${uid}</td>
                <td>${name}</td>
                <td>${handle}</td>
                <td>Error fetching data</td>
              </tr>
            `;
            continue;
          }
  
          // Check if the problem is solved
          const solved = data.result.some(
            (submission) =>
              submission.problem.contestId + submission.problem.index === problemCode &&
              submission.verdict === "OK"
          );
  
          // Set color to red if problem is not solved
          const solvedText = solved ? "Yes" : "No";
          const solvedStyle = solved ? "" : "color: red;";
  
          resultsHTML += `
            <tr>
              <td>${uid}</td>
              <td>${name}</td>
              <td>${handle}</td>
              <td style="${solvedStyle}">${solvedText}</td>
            </tr>
          `;
        } catch (error) {
          resultsHTML += `
            <tr>
              <td>${uid}</td>
              <td>${name}</td>
              <td>${handle}</td>
              <td>Error</td>
            </tr>
          `;
        }
      }
  
      resultsHTML += `
          </tbody>
        </table>
      `;
      resultsDiv.innerHTML = resultsHTML;
    };
  
    reader.readAsArrayBuffer(file);
  });
  