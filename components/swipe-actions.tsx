interface SwipeActionsProps {
  postId: string | null;
  onPass: (formData: FormData) => Promise<void>;
  onLike: (formData: FormData) => Promise<void>;
}

export default function SwipeActions({ postId, onPass, onLike }: SwipeActionsProps) {
  if (!postId) return null;

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <form action={onPass}>
        <input type="hidden" name="to_post_id" value={postId} />
        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-slate-700 text-lg font-semibold text-white transition hover:bg-slate-600"
        >
          ❌ Pasar
        </button>
      </form>

      <form action={onLike}>
        <input type="hidden" name="to_post_id" value={postId} />
        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-rose-600 text-lg font-semibold text-white transition hover:bg-rose-500"
        >
          ❤️ Proponer partido
        </button>
      </form>
    </div>
  );
}
