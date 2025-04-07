import { For, Show } from "solid-js";
import prettyBytes from "pretty-bytes";
import LogData from "@al/models/logData";
import usePage from "../usePage";
import useViewModel from "./useViewModel";

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
            class={`btn btn-lg gap-2 ${
              newFileDisabled() ? "btn-disabled" : "btn-primary"
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
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </Show>

          <button
            class={`btn btn-lg gap-2 ${
              analyzeDisabled() ? "btn-disabled" : "btn-success"
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
        <div class="card bg-base-100 shadow-lg w-full">
          <div class="card-body p-6">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-xl">Log Format Requirements</h2>
              <button
                data-collapse-toggle="format-instructions"
                type="button"
                class="btn btn-circle btn-ghost btn-sm"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>

            <div id="format-instructions" class="space-y-6">
              <div>
                <h3 class="font-medium mb-2">Required Keys</h3>
                <ul class="list-disc list-inside opacity-75 space-y-1 ml-2">
                  <li>level</li>
                  <li>timestamp</li>
                  <li>msg</li>
                </ul>
              </div>

              <div>
                <h3 class="font-medium mb-2">JSON Format</h3>
                <div class="mockup-code">
                  <pre>
                    <code>{`{"timestamp":"2023-10-16 10:13:16.710 +11:00","level":"debug","msg":"Received HTTP request","dynamicKey1":"value 1","dynamicKey2":"value 2"}`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 class="font-medium mb-2">Plain-text Format</h3>
                <div class="mockup-code">
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
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body p-6">
            <div class="mb-6">
              <h3 class="card-title text-xl">Optional Time Range Filter</h3>
              <p class="opacity-75 mt-1">
                Filter large files (&gt;100MB) or compare specific time slices
              </p>
            </div>

            <div class="space-y-6">
              <For each={logDatas()}>
                {(logData, idx) => (
                  <div class="bg-base-200 rounded-box p-6">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="flex items-center gap-3">
                        <div class="bg-base-100 p-2 rounded-lg">
                          <svg
                            class="w-6 h-6 opacity-75"
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
                          <p class="text-sm opacity-75">
                            {prettyBytes(logData.fileInfo.size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="form-control">
                        <label class="label" for={`start-time-${idx()}`}>
                          <span class="label-text">Start Time (Inclusive)</span>
                        </label>
                        <input
                          id={`start-time-${idx()}`}
                          type="text"
                          placeholder="YYYY-MM-DD HH:mm:ss.SSS Z"
                          class="input input-bordered"
                          onChange={(e) =>
                            setTimeRange(idx(), "min", e.target.value)
                          }
                        />
                      </div>
                      <div class="form-control">
                        <label class="label" for={`end-time-${idx()}`}>
                          <span class="label-text">End Time (Exclusive)</span>
                        </label>
                        <input
                          id={`end-time-${idx()}`}
                          type="text"
                          placeholder="YYYY-MM-DD HH:mm:ss.SSS Z"
                          class="input input-bordered"
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
