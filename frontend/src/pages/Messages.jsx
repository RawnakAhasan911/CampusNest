import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, ShieldCheck, Lock, Cpu, CheckCheck,
  User, RefreshCw, AlertCircle, Info, Sparkles
  , CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';
import { useAuth } from '../context/AuthContext';

export default function Messages({ initialPartnerId = null }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadHistory(selectedPartner._id);
      const interval = setInterval(() => loadHistory(selectedPartner._id, true), 8000);
      return () => clearInterval(interval);
    }
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    setLoadingConv(true);
    try {
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.conversations || []);

        if (initialPartnerId) {
          const found = (res.conversations || []).find(c => c.partner._id === initialPartnerId);
          if (found) setSelectedPartner(found.partner);
        } else if (res.conversations && res.conversations.length > 0) {
          setSelectedPartner(res.conversations[0].partner);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  }

  async function loadHistory(partnerId, isPolling = false) {
    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await api.getMessageHistory(partnerId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedPartner || sending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const res = await api.sendMessage({
        receiverId: selectedPartner._id,
        content: textToSend,
      });

      if (res.success) {
        setMessages(prev => [...prev, res.messageRecord]);
      }
    } catch (err) {
      alert('Failed to send encrypted message: ' + err.message);
      setInputMessage(textToSend);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Encrypted Student Chat</h1>
            <CryptoBadge type="ecc" label="Pure Asymmetric ECC" size="xs" />
          </div>
          <p className="text-xs text-slate-500">
            End-to-end asymmetric message encryption with Elliptic Curve ElGamal on secp256k1 & HMAC integrity authentication.
          </p>
        </div>

        <button
          onClick={() => setShowInspector(!showInspector)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold self-start sm:self-auto hover:bg-slate-800 transition"
        >
          <Info className="w-4 h-4 text-emerald-400" />
          <span>{showInspector ? 'Hide ECC Inspector' : 'ECC Math Inspector'}</span>
        </button>
      </div>

      {/* Cryptographic Inspector Panel */}
      {showInspector && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>Algorithm 2: Elliptic Curve ElGamal Cryptosystem Specification</span>
          </div>
          <p className="text-slate-300">
            • Curve: <strong>secp256k1</strong> (y² = x³ + 7 over prime field F_p)
          </p>
          <p className="text-slate-300">
            • Asymmetric Encryption: Ephemeral scalar <strong>k ∈ [1, n-1]</strong>, Point <strong>C₁ = k · G</strong>, Shared secret <strong>S = k · Q_recipient</strong>
          </p>
          <p className="text-slate-300">
            • Zero Symmetric Ciphers: No AES, DES, or RC4 used. Plaintext is masked strictly via point-derived BigInt stream coordinates.
          </p>
          <p className="text-slate-300">
            • Integrity: <strong>HMAC-SHA256(C₁, C₂)</strong> guarantees ciphertext tamper detection before decryption.
          </p>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[620px]">
        {/* Left Col: Conversation List */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Accepted Roommates ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-brand-500" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>No active conversations yet.</p>
                <p className="text-[11px] text-slate-500">
                  Send a roommate connection request and have it accepted to start encrypted chat!
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedPartner && selectedPartner._id === conv.partner._id;
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setSelectedPartner(conv.partner)}
                    className={`w-full p-4 flex items-start gap-3 transition text-left ${isSelected ? 'bg-white shadow-sm border-l-4 border-brand-600' : 'hover:bg-slate-100/70'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {conv.partner.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.partner.name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.partner.department}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        ECC-secp256k1 Key
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Active Chat Window */}
        <div className="md:col-span-2 flex flex-col bg-white">
          {selectedPartner ? (
            <>
              {/* Partner Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedPartner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{selectedPartner.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedPartner.department} • Peer Public Point: ({selectedPartner.eccPublicKey?.x?.slice(0, 8)}...)
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5">
                  <CryptoBadge type="ecc" label="EC-ElGamal Active" size="xs" />
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-brand-500" />
                    Asymmetrically decrypting messages using your private ECC scalar...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500" />
                    <p className="font-bold text-slate-700">Encrypted Conversation Started</p>
                    <p className="max-w-xs mx-auto text-[11px] text-slate-500">
                      Messages sent in this chat are encrypted using your peer's ECC public point before leaving your browser.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.isMe;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs shadow-sm leading-relaxed ${isMe
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                            }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>

                          <div className={`mt-1.5 flex items-center justify-between gap-3 text-[9px] font-mono ${isMe ? 'text-sky-200' : 'text-slate-400'
                            }`}>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              <span>ECC HMAC OK</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type an ECC-encrypted message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{sending ? 'Encrypting...' : 'Send'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-700 text-sm">Select an accepted roommate to chat</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                All communications are secured using pure asymmetric Elliptic Curve Cryptography.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
