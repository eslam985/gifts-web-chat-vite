import React, { useState, useEffect, useCallback, useRef } from "react";

// استيراد تهيئة Firebase والـ appId من الملف الذي أنشأته للتو
import { auth, db, firebaseApp, firestoreAppId } from "./firebase-config";
// استيراد دوال المصادقة من Firebase SDK مباشرة
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
// استيراد دوال Firestore من Firebase SDK مباشرة
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore";

// 🛑 نقطة النهاية للـ Webhook
const FULFILLMENT_ENDPOINT_URL = "https://gifts-bot-webhook.vercel.app/webhook";
const SESSION_STORAGE_KEY = "gift_shop_chat_messages";

// === دالة تحميل الرسائل من sessionStorage ===
const loadMessagesFromSession = () => {
  const storedMessages = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (storedMessages) {
    try {
      return JSON.parse(storedMessages);
    } catch (e) {
      console.error("Error parsing messages from sessionStorage", e);
      return [];
    }
  }
  return [];
};

// === دالة حفظ الرسائل إلى sessionStorage ===
const saveMessagesToSession = (msgs) => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error("Error saving messages to sessionStorage", e);
  }
};

// === SVG Icons ===
const BagIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4" />
    <line x1="3" x2="21" y1="6" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
    <title>أيقونة المتجر</title>
  </svg>
);

const ZapIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    <title>أيقونة سريعة</title>
  </svg>
);

const SendInputIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
    <title>أيقونة إرسال</title>
  </svg>
);

const DollarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    <title>أيقونة سعر</title>
  </svg>
);

const WhatsAppSendIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
    <title>أيقونة واتساب</title>
  </svg>
);

// =================================================================
// المكون الفرعي: بطاقة المنتج Rich Content
// =================================================================
const ProductCard = ({ product }) => {
  const defaultImageUrl =
    "https://placehold.co/400x200/4F46E5/FFFFFF?text=Product+Image";
  const whatsappNumber = "201013080898";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=أرغب%20في%20شراء%20${product.name}`;
  const displayPrice = product.price || "غير محدد";
  const displayDescription = product.description || "الوصف غير متوفر حاليًا.";

  return (
    <div className="product-card bg-white rounded-xl shadow-lg max-w-sm overflow-hidden border border-indigo-100 mx-auto">
      <div className="product-image h-40 overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl || defaultImageUrl}
          alt={product.name}
          className="product-img w-full h-full object-cover transition duration-300 hover:scale-[1.05]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImageUrl;
          }}
        />
      </div>

      <div className="product-content p-4 flex flex-col items-end text-right" dir="rtl">
        <h3 className="product-title text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
        <div className="product-details space-y-1 text-sm text-gray-600 w-full">
          <p className="price flex justify-end items-center">
            <DollarIcon className="ml-2 text-green-600 flex-shrink-0" />
            <span className="price-value font-semibold text-green-700">{displayPrice}</span>
            :السعر
          </p>
          <p className="description text-xs text-gray-500 line-clamp-2">
            {displayDescription}
          </p>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn mt-4 w-full flex justify-center items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition duration-150 transform hover:scale-[1.01]"
        >
          <WhatsAppSendIcon className="ml-2" />
          اطلب عبر الواتساب الآن
        </a>
      </div>
    </div>
  );
};

// =================================================================
// دالة إرسال الاستعلام للـ Fulfillment API
// =================================================================
const MAX_RETRIES = 3;
const fetchFulfillmentResponse = async (query, retries = 0) => {
  try {
    const response = await fetch(FULFILLMENT_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session: "projects/gifts-bot/agent/custom-session-id-123",
        queryInput: {
          text: { text: query, languageCode: "ar-EG" },
        },
        customPayload: { platform: "CUSTOM_REACT_UI" },
      }),
    });

    if (!response.ok) {
      if (retries < MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchFulfillmentResponse(query, retries + 1);
      }
      throw new Error(
        `خطأ ${response.status}: فشل الاتصال بالخادم بعد ${MAX_RETRIES} محاولات.`
      );
    }

    const data = await response.json();
    const queryResult = data.queryResult;

    if (!queryResult) {
      throw new Error("تنسيق رد Webhook غير صالح.");
    }

    const fulfillmentMessages = queryResult.fulfillmentMessages || [];
    const textMessage = fulfillmentMessages.find(
      (m) => m.text?.text?.length > 0
    );
    const quickRepliesMessage = fulfillmentMessages.find(
      (m) => m.quickReplies?.quickReplies?.length > 0
    );
    const payloadMessage = fulfillmentMessages.find((m) => m.payload);

    let botResponse = {
      type: "TEXT",
      text:
        queryResult.fulfillmentText ||
        textMessage?.text?.text?.[0] ||
        "لم يتم الحصول على رد نصي.",
      quickReplies: quickRepliesMessage?.quickReplies?.quickReplies || [],
      product: null,
      customButton: null,
    };

    const productCardData = payloadMessage?.payload?.productCard;
    const customButtonData = payloadMessage?.payload?.customButton;

    if (productCardData && productCardData.name && productCardData.imageUrl) {
      botResponse.type = "PRODUCT_CARD";
      botResponse.product = {
        name: productCardData.name,
        price: productCardData.price || "غير محدد",
        description: productCardData.description || "لا يوجد وصف.",
        imageUrl: productCardData.imageUrl,
      };
    } else if (customButtonData && customButtonData.isCustomButton) {
      botResponse.type = "CUSTOM_BUTTON";
      botResponse.customButton = customButtonData;
      botResponse.text =
        queryResult.fulfillmentText || "يرجى التواصل مع الدعم.";
    }

    return botResponse;
  } catch (error) {
    console.error("API Call FAILED:", error);
    return {
      type: "TEXT",
      text: `🛑 فشل الاتصال. الرسالة: ${error.message}`,
      quickReplies: [],
    };
  }
};

// =================================================================
// المكون الرئيسي: واجهة الدردشة (مع دمج Firestore)
// =================================================================
const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [placeholder, setPlaceholder] = useState("اكتب رسالتك...");

  // حالات Firebase
  const [firestoreDb, setFirestoreDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const isFirebaseAvailable = !!auth && !!db;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // === 1. تهيئة Firebase والمصادقة ===
  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.warn(
        "Firebase config/modules not fully available. Using SessionStorage for persistence."
      );
      setUserId("session-user");
      setIsAuthReady(true);
      setMessages(loadMessagesFromSession());
      return;
    }

    try {
      setFirestoreDb(db);

      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          try {
            await signInAnonymously(auth);
          } catch (error) {
            console.error("Firebase Sign-In Failed:", error);
          }
        }

        const currentUserId = auth.currentUser?.uid || crypto.randomUUID();
        setUserId(currentUserId);
        setIsAuthReady(true);
      });

      return () => unsubscribeAuth();
    } catch (e) {
      console.error("Firebase Initialization Error:", e);
      setUserId("init-error-user");
      setIsAuthReady(true);
    }
  }, [isFirebaseAvailable]);

  // === 2. منطق الاستماع لـ Firestore ===
  useEffect(() => {
    if (
      !isAuthReady ||
      !isFirebaseAvailable ||
      !firestoreDb ||
      !userId ||
      userId === "session-user"
    )
      return;

    const messagesCollectionRef = collection(
      firestoreDb,
      `artifacts/${firestoreAppId}/users/${userId}/chat_messages`
    );
    const q = query(messagesCollectionRef);

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        let loadedMessages = snapshot.docs.map((docData) => {
          const data = docData.data();
          const timestampValue = data.timestamp
            ? data.timestamp.seconds * 1000
            : Date.now();

          let richContent = {};
          try {
            if (data.product && typeof data.product === "string")
              richContent.product = JSON.parse(data.product);
            else if (data.product) richContent.product = data.product;

            if (data.customButton && typeof data.customButton === "string")
              richContent.customButton = JSON.parse(data.customButton);
            else if (data.customButton)
              richContent.customButton = data.customButton;
          } catch (e) {
            console.error("Error parsing rich content JSON:", e);
          }

          return {
            id: docData.id,
            text: data.text,
            sender: data.sender,
            type: data.type || "TEXT",
            quickReplies: data.quickReplies || [],
            ...richContent,
            timestamp: timestampValue,
          };
        });

        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);

        if (!isInitialLoadDone && loadedMessages.length === 0) {
          handleSendInitialMessage();
        }
        setIsInitialLoadDone(true);
        setTimeout(scrollToBottom, 50);
      },
      (error) => {
        console.error("Error listening to messages:", error);
        if (!messages.length) handleSendInitialMessage();
        setIsInitialLoadDone(true);
      }
    );

    return () => unsubscribeSnapshot();
  }, [isAuthReady, isFirebaseAvailable, firestoreDb, userId]);

  // === 3. منطق التحميل الأولي ===
  useEffect(() => {
    if (
      isAuthReady &&
      userId === "session-user" &&
      messages.length === 0 &&
      !isInitialLoadDone
    ) {
      handleSendInitialMessage();
      setIsInitialLoadDone(true);
    }
  }, [isAuthReady, userId, isInitialLoadDone]);

  // دالة حفظ الرسالة
  const saveMessage = async (message) => {
    if (
      isFirebaseAvailable &&
      firestoreDb &&
      userId &&
      userId !== "session-user"
    ) {
      try {
        const messagesCollectionRef = collection(
          firestoreDb,
          `artifacts/${firestoreAppId}/users/${userId}/chat_messages`
        );

        const payloadToSave = {
          text: message.text,
          sender: message.sender,
          type: message.type,
          quickReplies: message.quickReplies || [],
          timestamp: new Date(),
        };

        if (message.product)
          payloadToSave.product = JSON.stringify(message.product);
        if (message.customButton)
          payloadToSave.customButton = JSON.stringify(message.customButton);

        const docId = Date.now().toString();
        await setDoc(doc(messagesCollectionRef, docId), payloadToSave);
        return;
      } catch (e) {
        console.error("Failed to save message to Firestore:", e);
      }
    }

    setMessages((prev) => {
      const updatedMessages = [...prev, message];
      saveMessagesToSession(updatedMessages);
      return updatedMessages;
    });

    if (!isFirebaseAvailable) {
      console.warn(
        "Using temporary sessionStorage. Messages will be lost when the tab is closed."
      );
    }
  };

  const handleSendInitialMessage = useCallback(async () => {
    const fulfillmentResponse = await fetchFulfillmentResponse("مرحبا");
    const initialBotMessage = {
      id: Date.now(),
      sender: "bot",
      type: fulfillmentResponse.type,
      text: fulfillmentResponse.text,
      quickReplies:
        fulfillmentResponse.quickReplies.length > 0
          ? fulfillmentResponse.quickReplies
          : ["عرض الأقسام", "أفضل التوصيات"],
      product: fulfillmentResponse.product,
      customButton: fulfillmentResponse.customButton,
      timestamp: Date.now(),
    };

    await saveMessage(initialBotMessage);
    setTimeout(scrollToBottom, 50);
  }, [isFirebaseAvailable, firestoreDb, userId]);

  // منطق الإرسال
  const handleSend = useCallback(
    async (query) => {
      const userQuery = query || input;
      if (userQuery.trim() === "" || isTyping || !isAuthReady) return;

      const userMessage = {
        id: Date.now(),
        text: userQuery,
        sender: "user",
        type: "TEXT",
        timestamp: Date.now(),
      };
      await saveMessage(userMessage);

      setInput("");
      setIsTyping(true);
      setPlaceholder("الروبوت يكتب...");
      setTimeout(scrollToBottom, 0);

      const fulfillmentResponse = await fetchFulfillmentResponse(userQuery);

      setIsTyping(false);
      setPlaceholder("اكتب رسالتك...");

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        type: fulfillmentResponse.type,
        text: fulfillmentResponse.text,
        quickReplies: fulfillmentResponse.quickReplies,
        product: fulfillmentResponse.product,
        customButton: fulfillmentResponse.customButton,
        timestamp: Date.now() + 1,
      };

      await saveMessage(botMessage);
      setTimeout(scrollToBottom, 50);
    },
    [input, isTyping, isAuthReady, isFirebaseAvailable, firestoreDb, userId]
  );

  const handleQuickReply = (text) => {
    handleSend(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === "PRODUCT_CARD") {
      return <ProductCard product={message.product} />;
    }

    if (message.type === "CUSTOM_BUTTON" && message.customButton) {
      const whatsappNumber = "201013080898";
      const initialText =
        message.customButton.initialText ||
        "السلام عليكم، أرغب في التواصل بخصوص استفسار إداري.";
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        initialText
      )}`;

      return (
        <div className="custom-button-message flex flex-col items-end w-full space-y-3 p-3 bg-white rounded-xl rounded-tl-none border border-gray-200 shadow-lg">
          <p className="custom-button-text text-gray-700 whitespace-pre-wrap w-full text-right leading-relaxed border-b border-gray-100 pb-2 mb-2">
            {message.text || "يرجى التواصل مع صاحب المتجر."}
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`custom-button-link w-full flex justify-center items-center px-4 py-2 ${
              message.customButton.colorClass || "bg-green-600"
            } text-white font-semibold rounded-md shadow-lg hover:bg-green-700 transition duration-150 transform hover:scale-[1.01]`}
          >
            <WhatsAppSendIcon className="ml-2" />
            {message.customButton.buttonLabel || "تواصل الآن"}
          </a>
        </div>
      );
    }

    const textContent = message.text || "لم يتم الحصول على رد نصي.";
    return (
      <p className="text-message text-gray-700 whitespace-pre-wrap leading-relaxed">
        {textContent}
      </p>
    );
  };

  const lastBotMessage = messages
    .slice()
    .reverse()
    .find((m) => m.sender === "bot");
  const quickReplies = lastBotMessage?.quickReplies || [];

  if (!isAuthReady) {
    return (
      <div className="loading-container flex justify-center items-center h-full text-gray-500">
        جاري تهيئة الاتصال والمصادقة...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="app-container flex justify-center items-center h-full bg-gray-50 p-4 font-sans"
    >
      <div className="chat-container w-full h-full flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden border border-indigo-200">
        {/* رأس المحادثة */}
        <header className="chat-header flex justify-around items-center p-4 bg-gray-600 text-white shadow-md">
          <BagIcon className="header-icon ml-3" />
          <h1 className="header-title text-lg font-bold">مساعد متجر الهدايا Ai </h1>
          {isFirebaseAvailable && userId && userId !== "session-user" ? (
            <span className="status-online mr-2 text-xs text-green-500 bg-gray-700 p-1 rounded-full px-2">
              online DB
            </span>
          ) : (
            <span className="status-offline mr-2 text-xs text-yellow-300 bg-gray-800 p-1 rounded-full px-2">
              DB
            </span>
          )}
        </header>

        {/* نافذة الرسائل */}
        <div
          id="chat-messages"
          className="messages-container flex-1 p-4 space-y-4 overflow-y-auto bg-gray-100 chat-area-scroll"
        >
          {messages.map((message, index) => {
            const isUser = message.sender === "user";
            const isRichContent =
              message.type === "PRODUCT_CARD" ||
              message.type === "CUSTOM_BUTTON";

            const bubbleClasses = isUser
              ? "user-message p-3 bg-indigo-100 text-gray-800 rounded-tr-none"
              : isRichContent
              ? "bot-rich-message p-0 bg-transparent"
              : "bot-text-message p-3 bg-white text-gray-800 rounded-tl-none border border-gray-200";

            return (
              <div
                key={message.id || index}
                className={`message-wrapper flex ${isUser ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`message-bubble max-w-[75%] rounded-xl shadow-sm ${bubbleClasses}`}
                >
                  {renderMessageContent(message)}
                </div>
              </div>
            );
          })}

          {/* مؤشر الكتابة */}
          {isTyping && (
            <div className="typing-container flex justify-end">
              <div className="typing-indicator-bubble max-w-[75%] p-3 rounded-xl bg-[#e2fff9] text-gray-800 rounded-tl-none border border-gray-200 shadow-sm">
                <div className="typing-indicator flex space-x-1 items-center">
                  <span className="dot dot-1 bg-indigo-500"></span>
                  <span className="dot dot-2 bg-indigo-500"></span>
                  <span className="dot dot-3 bg-indigo-500"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* الأزرار السريعة */}
        {quickReplies.length > 0 && (
          <div className="quick-replies-container p-3 bg-white border-t border-gray-200 flex flex-wrap justify-end gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                disabled={isTyping || !isAuthReady}
                className="quick-reply-btn px-3 py-1 text-sm bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-100 transition duration-150 shadow-sm flex items-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZapIcon className="quick-reply-icon ml-1 text-yellow-500" />
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* شريط الإدخال */}
        <div className="input-container p-4 bg-white border-t border-gray-200">
          <div className="input-wrapper flex space-x-2" dir="ltr">
            <input
              type="text"
              className="message-input flex-1 w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-gray-700 text-right text-gray-700 disabled:bg-gray-50 disabled:cursor-not-allowed"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              dir="rtl"
              disabled={isTyping || !isAuthReady}
            />
            <button
              onClick={() => handleSend()}
              className={`send-btn p-3 bg-gray-300 rounded-lg text-white transition duration-150 ${
                input.trim() && !isTyping && isAuthReady
                  ? "bg-green-600 hover:bg-green-300"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!input.trim() || isTyping || !isAuthReady}
            >
              <SendInputIcon className="send-icon transform -scale-x-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;