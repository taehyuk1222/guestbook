"use client";

import { useState, useEffect } from "react";
import { Heart, Menu, Bell, MoreVertical, Send, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  created_at: string;
  likes: number;
  is_deleted: boolean;
  // 임시 필드들 (MVP용)
  isLikedByMe?: boolean;
  isMine?: boolean;
};

// 임시 현재 접속자 설정 (Auth 연동 전)
const CURRENT_USER_NAME = "박지성";

export default function GuestbookPage() {
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else if (data) {
      // 로컬 전용 속성 추가
      const formattedData = data.map((post) => ({
        ...post,
        isMine: post.author === CURRENT_USER_NAME,
        isLikedByMe: false, // 로컬 상태로 관리
      }));
      setPosts(formattedData);
    }
    setIsLoading(false);
  };

  const filteredPosts = activeTab === "all" ? posts : posts.filter((p) => p.isMine);

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiking = !post.isLikedByMe;
    const newLikesCount = isLiking ? post.likes + 1 : post.likes - 1;

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: newLikesCount, isLikedByMe: isLiking }
          : p
      )
    );

    // 실제 DB 업데이트
    const { error } = await supabase
      .from("posts")
      .update({ likes: newLikesCount })
      .eq("id", postId);

    if (error) {
      console.error("Error updating likes:", error);
      // 롤백
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes: post.likes, isLikedByMe: post.isLikedByMe }
            : p
        )
      );
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    // Optimistic UI Update
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    // 실제 DB Soft Delete
    const { error } = await supabase
      .from("posts")
      .update({ is_deleted: true })
      .eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      alert("삭제에 실패했습니다.");
      fetchPosts(); // 복구
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || newMessage.length > 120) return;

    const newPostData = {
      author: CURRENT_USER_NAME,
      content: newMessage.trim(),
    };

    // UI 먼저 업데이트 시도할 수도 있지만, ID 생성을 위해 DB 응답 대기
    const { data, error } = await supabase
      .from("posts")
      .insert([newPostData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting post:", error);
      alert("글 작성에 실패했습니다.");
      return;
    }

    if (data) {
      setPosts([
        {
          ...data,
          isMine: true,
          isLikedByMe: false,
        },
        ...posts,
      ]);
      setNewMessage("");
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full h-screen">
      <header className="flex items-center justify-between px-4 py-4 bg-white border-b sticky top-0 z-10">
        <button className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">우리 반 방명록</h1>
        <button className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </header>

      <div className="flex px-4 py-3 bg-white border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-full transition-colors ${
            activeTab === "all" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          전체 글
        </button>
        <div className="w-2" />
        <button
          onClick={() => setActiveTab("mine")}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-full transition-colors ${
            activeTab === "mine" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          내 글
        </button>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>아직 등록된 방명록이 없어요.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {post.avatar ? (
                        <img src={post.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{post.author}</div>
                      <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                    </div>
                  </div>
                  {post.isMine && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                      post.isLikedByMe ? "text-pink-600 bg-pink-50" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLikedByMe ? "fill-pink-600" : ""}`} />
                    {post.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 pb-safe">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl p-1 relative">
            <textarea
              className="w-full bg-transparent resize-none outline-none py-2 px-3 text-sm max-h-24"
              rows={1}
              placeholder="메시지를 남겨보세요... (최대 120자)"
              value={newMessage}
              onChange={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
                setNewMessage(e.target.value.slice(0, 120));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-2 right-3 text-[10px] text-gray-400">
              {newMessage.length}/120
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 mb-1 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
