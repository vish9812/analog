import { For, Show } from "solid-js";
import prettyBytes from "pretty-bytes";
import LogData from "@al/models/logData";
import useViewModel from "./useViewModel";
import usePage from "../usePage";

function Normalize() {
  const { setPage } = usePage();

  const {
    logDatas,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
    setTimeRange,
  } = useViewModel();

  const newFileText = () =>
    logDatas().length === 1 ? "Compare With" : "New File";

  return (
    <>
      {/* Main Actions */}
      <div class="flex flex-col items-center gap-6 py-8">
        <div class="flex items-center gap-4">
          <label
            class={`inline-flex items-center px-6 py-3 text-lg font-medium rounded-lg gap-2 ${
              newFileDisabled()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
            }`}
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {newFileText()}
            <input
              type="file"
              class="hidden"
              onChange={(e) => {
                handleFileUpload(e.target.files, new LogData());
                e.target.value = "";
              }}
              disabled={newFileDisabled()}
            />
          </label>

          <Show when={processingFile()}>
            <div class="flex items-center justify-center">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </Show>

          <button
            class={`inline-flex items-center px-6 py-3 text-lg font-medium rounded-lg gap-2 ${
              analyzeDisabled()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
            }`}
            onClick={() => handleAnalyzeClick(setPage)}
            disabled={analyzeDisabled()}
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Analyze
          </button>
        </div>

        {/* Format Instructions Card */}
        <div class="w-full bg-white rounded-lg shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">Log Format Requirements</h2>
            </div>

            <div id="format-instructions" class="space-y-6">
              <div>
                <h3 class="font-medium mb-2">Required Keys</h3>
                <ul class="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>level</li>
                  <li>timestamp</li>
                  <li>msg</li>
                </ul>
              </div>

              <div>
                <h3 class="font-medium mb-2">JSON Format</h3>
                <div class="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <pre>
                    <code>{`{"timestamp":"2023-10-16 10:13:16.710 +11:00","level":"debug","msg":"Received HTTP request","dynamicKey1":"value 1","dynamicKey2":"value 2"}`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 class="font-medium mb-2">Plain-text Format</h3>
                <div class="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <pre>
                    <code>
                      debug [2023-10-16 10:13:16.710 +11:00] Received HTTP
                      request dynamicKey1="value 1" dynamicKey2=value 2
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <Show when={!!logDatas().length}>
        <div class="bg-white rounded-lg shadow-lg">
          <div class="p-6">
            <div class="mb-6">
              <h3 class="text-xl font-semibold">Optional Time Range Filter</h3>
              <p class="text-gray-600 mt-1">
                Filter large files (&gt;100MB) or compare specific time slices
              </p>
            </div>

            <div class="space-y-6">
              <For each={logDatas()}>
                {(logData, idx) => (
                  <div class="bg-gray-100 rounded-lg p-6">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="flex items-center gap-3">
                        <div class="bg-white p-2 rounded-lg">
                          <svg
                            class="w-6 h-6 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p class="font-medium">{logData.fileInfo.name}</p>
                          <p class="text-sm text-gray-600">
                            {prettyBytes(logData.fileInfo.size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          for={`start-time-${idx()}`}
                        >
                          Start Time (Inclusive)
                        </label>
                        <input
                          id={`start-time-${idx()}`}
                          type="text"
                          placeholder="YYYY-MM-DD HH:mm:ss.SSS Z"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) =>
                            setTimeRange(idx(), "min", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          for={`end-time-${idx()}`}
                        >
                          End Time (Exclusive)
                        </label>
                        <input
                          id={`end-time-${idx()}`}
                          type="text"
                          placeholder="YYYY-MM-DD HH:mm:ss.SSS Z"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) =>
                            setTimeRange(idx(), "max", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}

export default Normalize;
