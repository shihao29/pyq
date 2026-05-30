import React, { useState, useRef, useEffect } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { Loader2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EMOJI_LIST } from './data/momentsData';
import { supabase, getMoments, toggleLike as toggleLikeSupabase, addComment as addCommentSupabase, deleteMoment, deleteComment, type MomentWithDetails, DEFAULT_AVATAR } from './lib/supabase';

interface MomentItemProps {
  moment: MomentWithDetails;
  currentUserId: string;
  activePopoverId: string | null;
  activeCommentInputId: string | null;
  activeEmojiPanelId: string | null;
  commentText: string;
  replyingToComment: { user_id: string; user_nickname: string; user_avatar: string; content: string } | null;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  setActivePopoverId: (id: string | null) => void;
  setActiveCommentInputId: (id: string | null) => void;
  setActiveEmojiPanelId: (id: string | null) => void;
  setCommentText: (text: string) => void;
  setReplyingToComment: (comment: any | null) => void;
  onToggleLike: (momentId: string) => Promise<void>;
  onSubmitComment: (momentId: string) => Promise<void>;
  onDeleteMoment: (momentId: string) => Promise<void>;
  onCommentClick: (momentId: string, comment: any) => void;
  handleEmojiClick: (e: React.MouseEvent, emoji: string) => void;
}

function MomentItem({
  moment,
  currentUserId,
  activePopoverId,
  activeCommentInputId,
  activeEmojiPanelId,
  commentText,
  replyingToComment,
  inputRef,
  setActivePopoverId,
  setActiveCommentInputId,
  setActiveEmojiPanelId,
  setCommentText,
  setReplyingToComment,
  onToggleLike,
  onSubmitComment,
  onDeleteMoment,
  onCommentClick,
  handleEmojiClick
}: MomentItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLiked = moment.likes.some(l => l.user_id === currentUserId);
  const isCommenting = activeCommentInputId === moment.id;
  const hasInteractions = moment.likes.length > 0 || moment.comments.length > 0 || isCommenting;
  const shouldTruncate = moment.content.length > 120;
  const likeNicknames = moment.likes.map(l => l.user_nickname);
  const isOwner = currentUserId === moment.author_id;

  const toggleActionMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePopoverId(activePopoverId === moment.id ? null : moment.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePopoverId(null);
    if (window.confirm('确定要删除这条朋友圈吗？')) {
      onDeleteMoment(moment.id);
    }
  };

  return (
    <div className="flex w-full box-border pl-4 pr-4 md:px-5 py-4 md:py-5 border-b border-wx-line bg-white overflow-hidden">
      <div className="ml-4 md:ml-0 w-[42px] h-[42px] flex-shrink-0 rounded-[4px] overflow-hidden bg-gray-200 cursor-pointer">
        <img src={moment.author_avatar || DEFAULT_AVATAR} alt={moment.author_nickname} className="w-full h-full object-cover" />
      </div>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="text-[#576b95] font-medium text-[16px] cursor-pointer">{moment.author_nickname}</div>
        
        <div className={`mt-1 text-[16px] text-[#1a1a1a] leading-[1.5] tracking-[0.5px] break-all text-justify whitespace-pre-wrap ${!isExpanded && shouldTruncate ? 'line-clamp-6' : ''}`}>
          {moment.content === '联系我请点这里' ? (
            <span className="text-[#576b95]">
              {moment.content}
            </span>
          ) : (
            moment.content
          )}
        </div>
        
        {shouldTruncate && (
          <div 
            className="text-[#576b95] text-[15px] mt-1 cursor-pointer hover:opacity-80"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '全文'}
          </div>
        )}
        
        {moment.image_urls && moment.image_urls.length > 0 && (
          <div className={`mt-2 ${
            moment.image_urls.length === 1 ? 'w-2/3' :
            moment.image_urls.length === 2 || moment.image_urls.length === 4 ? 'grid grid-cols-2 gap-1.5 w-[66%]' :
            'grid grid-cols-3 gap-1.5 w-full pr-4'
          }`}>
            {moment.image_urls.map((img, idx) => (
              <PhotoView key={idx} src={img}>
                <img
                  key={idx}
                  src={img}
                  loading="lazy"
                  alt="moment-pic"
                  className={`object-cover cursor-pointer ${
                    moment.image_urls.length === 1 ? 'max-h-[200px] w-auto' : 'aspect-square w-full h-full'
                  }`}
                />
              </PhotoView>
            ))}
          </div>
        )}
        
        <div className="mt-3 flex justify-between items-center h-[20px] relative">
          <span className="text-gray-400 text-[13px]">{moment.display_time}</span>
          
          <div className="relative flex items-center">
            <div className={`absolute right-[38px] top-1/2 transform -translate-y-1/2 bg-[#4c5154] rounded-[4px] flex items-center text-white text-[13px] overflow-hidden transition-all duration-200 z-10 ${
              activePopoverId === moment.id 
                ? (isOwner ? 'w-[210px] opacity-100' : 'w-[140px] opacity-100') 
                : 'w-0 opacity-0 pointer-events-none'
            }`}>
              <div className="flex-1 flex justify-center items-center py-2.5 hover:bg-[#5a5f62] cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleLike(moment.id); }}>
                <svg className="w-[14px] h-[14px] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                {isLiked ? '取消' : '赞'}
              </div>
              <div className="w-[1px] h-[16px] bg-[#3a3e40]"></div>
              <div className="flex-1 flex justify-center items-center py-2.5 hover:bg-[#5a5f62] cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveCommentInputId(moment.id); setActivePopoverId(null); }}>
                <svg className="w-[14px] h-[14px] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                评论
              </div>
              {isOwner && (
                <>
                  <div className="w-[1px] h-[16px] bg-[#3a3e40]"></div>
                  <div className="flex-1 flex justify-center items-center py-2.5 hover:bg-[#5a5f62] cursor-pointer" onClick={handleDeleteClick}>
                    <svg className="w-[14px] h-[14px] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    删除
                  </div>
                </>
              )}
            </div>

            <div onClick={(e) => toggleActionMenu(e)} className="w-[32px] h-[20px] bg-gray-100 flex items-center justify-center rounded-[4px] cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex space-x-[3px]">
                <div className="w-1 h-1 bg-wx-blue rounded-full"></div>
                <div className="w-1 h-1 bg-wx-blue rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {hasInteractions && (
          <div className="mt-2 bg-wx-light-gray rounded-sm relative text-[14px]">
            <div className="absolute top-[-6px] left-[15px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-wx-light-gray"></div>
            
            {moment.likes.length > 0 && (
              <div className="p-2 border-b border-gray-200/50 flex items-start">
                <svg className="w-4 h-4 text-wx-blue mr-1.5 flex-shrink-0 mt-[2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                <span className="text-wx-blue font-medium break-words">{likeNicknames.join('，')}</span>
              </div>
            )}

            {moment.comments.map((c, i) => (
              <div 
                key={i} 
                className="px-2 py-1.5 first:pt-2 break-words cursor-pointer hover:bg-gray-100 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(moment.id, c);
                }}
              >
                <span className="text-wx-blue font-medium cursor-pointer">{c.user_nickname}</span>
                {c.content.includes('回复') ? '' : '：'}
                <span className="text-gray-800">{c.content}</span>
              </div>
            ))}

            {isCommenting && (
              <div className="px-2 pb-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <div className="border border-wx-green bg-white rounded flex flex-col p-2 shadow-sm">
                  {replyingToComment && (
                    <div className="bg-gray-50 p-2 rounded mb-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        回复 <span className="text-wx-blue">{replyingToComment.user_nickname}</span>：
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingToComment(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        取消
                      </button>
                    </div>
                  )}
                  <textarea 
                    ref={inputRef}
                    autoFocus
                    rows={2} 
                    className="w-full focus:outline-none resize-none text-[15px] placeholder-gray-400 bg-transparent" 
                    placeholder={replyingToComment ? `回复 @${replyingToComment.user_nickname}` : "评论"}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="relative flex justify-between items-center mt-2">
                      <div className="flex space-x-4 text-gray-500 items-center">
                        <svg className="w-6 h-6 cursor-not-allowed opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        <svg onClick={(e) => { e.stopPropagation(); setActiveEmojiPanelId(activeEmojiPanelId === moment.id ? null : moment.id); }} className="w-6 h-6 cursor-pointer hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <svg className="w-6 h-6 cursor-not-allowed opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSubmitComment(moment.id); }} className={`${commentText.trim() ? 'bg-wx-green text-white' : 'bg-gray-100 text-gray-400'} px-5 py-1.5 rounded text-[14px] font-medium transition-colors`}>发送</button>
                    
                    {activeEmojiPanelId === moment.id && (
                      <div className="absolute bottom-[40px] left-[-8px] bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[280px] z-50 select-none">
                        <div className="grid grid-cols-7 gap-1 max-h-[160px] overflow-y-auto pr-1">
                          {EMOJI_LIST.map(e => (
                            <span key={e} className="cursor-pointer text-[22px] hover:bg-gray-100 rounded text-center leading-loose" onClick={(ev) => handleEmojiClick(ev, e)}>{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 评论操作菜单组件
interface CommentActionMenuProps {
  comment: { user_id: string; user_nickname: string; user_avatar: string; content: string };
  momentId: string;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => Promise<void>;
}

function CommentActionMenu({ comment: _comment, onClose, onCopy, onDelete }: CommentActionMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full max-w-[430px] rounded-t-lg sm:rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 text-center text-sm text-gray-500">
          评论操作
        </div>
        <div className="flex flex-col">
          <button 
            onClick={() => { onCopy(); onClose(); }}
            className="py-4 px-6 text-center text-gray-800 hover:bg-gray-50 text-base border-b border-gray-100"
          >
            复制
          </button>
          <button 
            onClick={() => { onDelete(); onClose(); }}
            className="py-4 px-6 text-center text-red-500 hover:bg-gray-50 text-base border-b border-gray-100"
          >
            删除
          </button>
          <button 
            onClick={onClose}
            className="py-4 px-6 text-center text-gray-800 hover:bg-gray-50 text-base font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Moments() {
  const [feedData, setFeedData] = useState<MomentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserNickname, setCurrentUserNickname] = useState<string>('未知用户');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(DEFAULT_AVATAR);
  
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [activeCommentInputId, setActiveCommentInputId] = useState<string | null>(null);
  const [activeEmojiPanelId, setActiveEmojiPanelId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [showCommentMenu, setShowCommentMenu] = useState<{ comment: any; momentId: string } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const loadData = async (retryAttempt: number = 0) => {
    try {
      setIsLoading(true);
      setIsSyncing(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('用户未登录');
      }
      
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if ((fetchError || !existingUser) && retryAttempt < 3) {
        console.warn(`用户记录尚未同步，正在重试 (${retryAttempt + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)));
        return loadData(retryAttempt + 1);
      }
      
      if (fetchError || !existingUser) {
        throw new Error('用户信息同步失败，请刷新页面重试');
      }
      
      setIsSyncing(false);
      setCurrentUserId(existingUser.id);
      setCurrentUserNickname(existingUser.nickname || '未知用户');
      setCurrentUserAvatar(existingUser.avatar_url || DEFAULT_AVATAR);
      
      const data = await getMoments();
      setFeedData(data);
    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLike = async (momentId: string) => {
    try {
      setFeedData(prev => prev.map(m => {
        if (m.id === momentId) {
          const likedByMe = m.likes.some(l => l.user_id === currentUserId);
          if (likedByMe) {
            return {
              ...m,
              likes: m.likes.filter(l => l.user_id !== currentUserId)
            };
          } else {
            return {
              ...m,
              likes: [
                ...m.likes,
                { user_id: currentUserId, user_nickname: currentUserNickname, user_avatar: currentUserAvatar }
              ]
            };
          }
        }
        return m;
      }));
      
      await toggleLikeSupabase(momentId, currentUserId);
      setActivePopoverId(null);
    } catch (err) {
      console.error('点赞失败:', err);
      await loadData();
    }
  };

  const handleSubmitComment = async (momentId: string) => {
    if (!commentText.trim()) return;
    
    let text = commentText.trim();
    if (replyingToComment) {
      text = `回复 ${replyingToComment.user_nickname}：${text}`;
    }
    
    try {
      setFeedData(prev => prev.map(m => {
        if (m.id === momentId) {
          return {
            ...m,
            comments: [
              ...m.comments,
              { user_id: currentUserId, user_nickname: currentUserNickname, user_avatar: currentUserAvatar, content: text }
            ]
          };
        }
        return m;
      }));
      setCommentText('');
      setActiveCommentInputId(null);
      setActiveEmojiPanelId(null);
      setReplyingToComment(null);

      await addCommentSupabase(momentId, currentUserId, text);
    } catch (err) {
      console.error('评论失败:', err);
      await loadData();
    }
  };

  const handleDeleteMoment = async (momentId: string) => {
    try {
      setFeedData(prev => prev.filter(m => m.id !== momentId));
      await deleteMoment(momentId);
    } catch (err) {
      console.error('删除失败:', err);
      await loadData();
    }
  };

  const handleDeleteComment = async (momentId: string, comment: any) => {
    try {
      setFeedData(prev => prev.map(m => {
        if (m.id === momentId) {
          return {
            ...m,
            comments: m.comments.filter(c => 
              !(c.user_id === comment.user_id && c.content === comment.content)
            )
          };
        }
        return m;
      }));
      await deleteComment(comment);
    } catch (err) {
      console.error('删除评论失败:', err);
      await loadData();
    }
  };

  const handleCommentClick = (momentId: string, comment: any) => {
    if (comment.user_id === currentUserId) {
      // 自己的评论，弹出菜单
      setShowCommentMenu({ comment, momentId });
    } else {
      // 别人的评论，回复
      setReplyingToComment(comment);
      setActiveCommentInputId(momentId);
    }
  };

  const handleCopyComment = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // 简单的提示
      const originalTitle = document.title;
      document.title = '已复制';
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };

  const handleEmojiClick = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setCommentText(prev => prev + emoji);
    setActiveEmojiPanelId(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeCommentInputId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCommentInputId]);

  const handleGlobalClick = () => {
    setActivePopoverId(null);
    if (activeCommentInputId && !commentText.trim()) {
      setActiveCommentInputId(null);
      setActiveEmojiPanelId(null);
      setReplyingToComment(null);
    }
  };

  return (
    <div className="bg-gray-200/50 md:bg-gray-200 flex justify-center min-h-screen relative w-screen md:w-full overflow-x-hidden" onClick={handleGlobalClick}>
      <PhotoProvider
        bannerVisible={false}
        photoClosable={true}
      >
        
        <div className="bg-white w-full md:max-w-[430px] mx-auto min-h-screen relative flex flex-col md:shadow-2xl md:border-x border-gray-200">
          
          {/* 修复后的导航栏 - sticky + 背景 + 父级确保没有 overflow:hidden */}
          <div className="sticky top-0 z-50 bg-[#f7f7f7] border-b border-gray-200 flex items-center justify-between px-4 py-3 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="text-[#333] text-[16px] font-medium active:opacity-60"
            >
              退出
            </button>

            <span className="font-medium text-[17px] text-[#333]">
              朋友圈
            </span>

            <button 
              onClick={() => navigate('/publish')} 
              className="active:opacity-60 p-1"
            >
              <Camera size={22} className="text-[#333]" />
            </button>
          </div>
          
          <div className="relative w-full aspect-[3/2] bg-gray-300 flex-shrink-0">
            <img src="/images/朋友圈背景.jpg" alt="Cover" className="w-full h-full object-cover" />
            
            <div className="absolute right-4 -bottom-6 flex items-center justify-end">
              <span className="text-white text-[22px] font-bold mr-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-6">{currentUserNickname}</span>
              <div className="w-[70px] h-[70px] bg-white p-[2px] rounded-[6px] shadow-sm flex-shrink-0">
                <img src={currentUserAvatar} alt="Avatar" className="w-full h-full rounded-[4px] object-cover" />
              </div>
            </div>
          </div>
          
          <div className="h-[40px] w-full bg-white flex-shrink-0"></div>
          
          <div className="text-[14px] text-gray-700 text-right pr-4 mb-6 -mt-1 tracking-wide">
            利他就是最大的利己
          </div>

          {/* 滚动内容区域 */}
          <div className="pb-28 flex-1 overflow-y-auto">
            {isSyncing ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">正在同步用户信息...</span>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">加载中...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">
                <p>加载失败: {error}</p>
                <button 
                  onClick={() => loadData()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  重试
                </button>
              </div>
            ) : (
              feedData.map(moment => (
                <MomentItem 
                  key={moment.id}
                  moment={moment}
                  currentUserId={currentUserId}
                  activePopoverId={activePopoverId}
                  activeCommentInputId={activeCommentInputId}
                  activeEmojiPanelId={activeEmojiPanelId}
                  commentText={commentText}
                  replyingToComment={replyingToComment}
                  inputRef={inputRef}
                  setActivePopoverId={setActivePopoverId}
                  setActiveCommentInputId={setActiveCommentInputId}
                  setActiveEmojiPanelId={setActiveEmojiPanelId}
                  setCommentText={setCommentText}
                  setReplyingToComment={setReplyingToComment}
                  onToggleLike={handleToggleLike}
                  onSubmitComment={handleSubmitComment}
                  onDeleteMoment={handleDeleteMoment}
                  onCommentClick={handleCommentClick}
                  handleEmojiClick={handleEmojiClick}
                />
              ))
            )}
          </div>
        </div>
      </PhotoProvider>
      
      {/* 评论操作菜单 */}
      {showCommentMenu && (
        <CommentActionMenu
          comment={showCommentMenu.comment}
          momentId={showCommentMenu.momentId}
          onClose={() => setShowCommentMenu(null)}
          onCopy={() => handleCopyComment(showCommentMenu.comment.content)}
          onDelete={() => handleDeleteComment(showCommentMenu.momentId, showCommentMenu.comment)}
        />
      )}
    </div>
  );
}
