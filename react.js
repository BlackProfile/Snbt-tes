import { useState, useEffect, useRef } from 'react';

// Data simulasi soal dan prediksi
const questionsData = [
  {
    question: "Manakah dari berikut ini yang merupakan ibu kota negara Indonesia?",
    options: ["Kuala Lumpur", "Bangkok", "Jakarta", "Hanoi"],
    answer: "Jakarta",
    predicted: false
  },
  {
    question: "Berapakah hasil dari 15 x 8?",
    options: ["110", "120", "130", "140"],
    answer: "120",
    predicted: false
  },
  {
    question: "Siapakah presiden pertama Republik Indonesia?",
    options: ["Soekarno", "Soeharto", "Joko Widodo", "Megawati Soekarnoputri"],
    answer: "Soekarno",
    predicted: false
  },
  {
    question: "Rumus kimia untuk air adalah...",
    options: ["H2O2", "H2SO4", "NaCl", "H2O"],
    answer: "H2O",
    predicted: true // Ini adalah contoh soal prediksi
  },
  {
    question: "Apa nama alat musik tradisional dari Jawa Barat yang terbuat dari bambu?",
    options: ["Gamelan", "Angklung", "Sasando", "Seruling"],
    answer: "Angklung",
    predicted: true // Ini adalah contoh soal prediksi
  }
];

// Komponen utama aplikasi
export default function App() {
  // State untuk mengelola status ujian
  const [view, setView] = useState('start'); // 'start', 'test', 'results'
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(60 * 5); // 5 menit dalam detik
  const [score, setScore] = useState(0);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [cheatingReason, setCheatingReason] = useState('');
  const [fullscreenFailed, setFullscreenFailed] = useState(false); // State baru untuk menangani kegagalan layar penuh
  const timerRef = useRef(null);
  
  // Fungsi untuk memulai ujian
  const startTest = async () => {
    // Coba masuk mode layar penuh
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        // Jika gagal, set state untuk menampilkan pesan
        console.error(`Error requesting full-screen: ${err.message}`);
        setFullscreenFailed(true);
      });
      // Berhenti di sini, menunggu pengguna masuk mode layar penuh secara manual
      return;
    }

    // Jika sudah dalam mode layar penuh, lanjutkan ujian
    setFullscreenFailed(false);
    const shuffledQuestions = [...questionsData].sort(() => Math.random() - 0.5);
    shuffledQuestions.forEach(q => q.options = [...q.options].sort(() => Math.random() - 0.5));
    setQuestions(shuffledQuestions);
    setView('test');
    startTimer();
  };
  
  // Fungsi untuk memulai timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer(prevTime => {
        if (prevTime <= 1) {
          endTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Fungsi untuk mengakhiri ujian dan menghitung nilai
  const endTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    let finalScore = 0;
    questions.forEach(q => {
      if (answers[q.question] === q.answer) {
        finalScore += 1; // Poin untuk setiap jawaban benar
      }
    });
    setScore(finalScore);
    setView('results');
    
    // Keluar dari mode layar penuh
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Efek untuk mengaktifkan mekanisme anti-curang
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (view === 'test' && !document.fullscreenElement) {
        setCheatingDetected(true);
        setCheatingReason("Anda keluar dari mode layar penuh. Ujian dihentikan.");
        endTest();
      }
    };
    
    const handleVisibilityChange = () => {
      if (view === 'test' && document.hidden) {
        setCheatingDetected(true);
        setCheatingReason("Anda beralih ke tab lain atau keluar jendela. Ujian dihentikan.");
        endTest();
      }
    };
    
    const disableContextMenu = (e) => e.preventDefault();
    const disableCopyPaste = (e) => e.preventDefault();
    
    // Tambahkan event listeners saat view adalah 'test'
    if (view === 'test') {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('contextmenu', disableContextMenu);
      window.addEventListener('cut', disableCopyPaste);
      window.addEventListener('copy', disableCopyPaste);
      window.addEventListener('paste', disableCopyPaste);
    }
    
    // Bersihkan event listeners saat komponen dilepas atau view berubah
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', disableContextMenu);
      window.removeEventListener('cut', disableCopyPaste);
      window.removeEventListener('copy', disableCopyPaste);
      window.removeEventListener('paste', disableCopyPaste);
    };
  }, [view]);

  // Handle ketika pengguna memilih jawaban
  const handleAnswerChange = (question, selectedOption) => {
    setAnswers({
      ...answers,
      [question]: selectedOption,
    });
  };

  // Render halaman berdasarkan state 'view'
  const renderContent = () => {
    if (cheatingDetected) {
      return (
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Kecurangan Terdeteksi!</h2>
          <p className="text-xl text-red-500 mb-4">{cheatingReason}</p>
          <p className="text-gray-700">Ujian Anda telah dihentikan. Silakan mulai ulang jika Anda ingin mencoba lagi.</p>
          <button
            onClick={() => {
              setCheatingDetected(false);
              setCheatingReason('');
              setTimer(60 * 5);
              setView('start');
            }}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Mulai Ulang
          </button>
        </div>
      );
    }

    switch (view) {
      case 'start':
        const predictedQuestions = questionsData.filter(q => q.predicted);
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Simulasi SNBT</h1>
            <p className="text-lg text-gray-600 mb-6">Bersiaplah untuk ujian dengan simulasi SNBT yang ketat!</p>
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative mb-8 w-full max-w-lg">
              <strong className="font-bold">Peringatan Keras!</strong>
              <span className="block sm:inline"> Ujian ini sangat ketat. Anda harus berada dalam mode layar penuh dan tidak boleh beralih tab. Keluar dari mode ini akan mengakhiri ujian.</span>
            </div>
            
            {fullscreenFailed && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 w-full max-w-lg">
                <strong className="font-bold">Gagal Masuk Layar Penuh!</strong>
                <span className="block sm:inline"> Silakan klik ikon layar penuh di pojok kanan bawah jendela pratinjau ini, lalu klik tombol di bawah.</span>
              </div>
            )}
            
            <button
              onClick={startTest}
              className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition duration-300 transform hover:scale-105"
            >
              Mulai Ujian Sekarang
            </button>
            
            <div className="mt-12 w-full max-w-lg">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Prediksi Soal (Contoh)</h2>
              <ul className="bg-white p-6 rounded-lg shadow-md space-y-4 text-left">
                {predictedQuestions.map((q, index) => (
                  <li key={index} className="border-b pb-2 last:border-b-0">
                    <p className="font-semibold text-gray-800">Soal {index + 1}: {q.question}</p>
                    <p className="text-sm text-gray-600 mt-1">Jawaban: {q.answer}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-gray-500 italic">Catatan: Soal-soal ini hanya contoh dan tidak menjamin kemiripan dengan soal SNBT asli.</p>
            </div>
          </div>
        );
      case 'test':
        const currentQuestion = questions[currentQuestionIndex];
        return (
          <div className="flex flex-col h-full p-8 relative">
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
              Waktu: {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}
            </div>
            <div className="flex-grow flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Soal {currentQuestionIndex + 1} dari {questions.length}</h2>
              <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl text-left">
                <p className="text-lg text-gray-700 mb-6">{currentQuestion.question}</p>
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={answers[currentQuestion.question] === option}
                        onChange={() => handleAnswerChange(currentQuestion.question, option)}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-3 text-gray-800">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
              >
                Kembali
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                >
                  Soal Selanjutnya
                </button>
              ) : (
                <button
                  onClick={endTest}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition duration-300"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Hasil Ujian Anda</h1>
            <p className="text-2xl text-gray-700 mb-6">Skor Anda: <span className="font-bold text-blue-600">{score}</span> dari {questions.length}</p>
            <button
              onClick={() => {
                setCheatingDetected(false);
                setCheatingReason('');
                setTimer(60 * 5);
                setScore(0);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setView('start');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Mulai Ujian Baru
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 font-inter antialiased min-h-screen flex flex-col items-center justify-center">
      <div className="container mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
