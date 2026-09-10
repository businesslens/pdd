// ELK installs its message dispatcher in this worker. The small API wrapper
// stays on the main thread; all layout work runs here, with no nested worker.
import 'elkjs/lib/elk-worker.min.js'
