/** Copy the errors as a request for the reader's agent, and say whether it worked. */
export function useLocalCopyRequest() {
  const toast = useToast()
  return async (text: string | null | undefined) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.add({ title: 'Copied', description: 'Paste it to your agent to get the model fixed.', icon: 'i-lucide-copy', color: 'success' })
    } catch {
      toast.add({ title: 'Could not copy', description: 'Run businesslens lint and give its output to your agent instead.', icon: 'i-lucide-triangle-alert', color: 'error' })
    }
  }
}
