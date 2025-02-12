// lib/i18n/translations.js
const translations = {
    en: {
      title: "DB Query Analyzer",
      subtitle: "Analyze and optimize your database queries",
      dbSelection: {
        type: "Select your database type:",
        host: "Enter database host:",
        port: "Enter database port:",
        username: "Enter database username:",
        password: "Enter database password:",
        database: "Select database:",
        query: "Enter your SQL query:"
      },
      connection: {
        testing: "Testing database connection...",
        success: {
          mysql: "Successfully connected to MySQL server!",
          postgresql: "Successfully connected to PostgreSQL server!"
        },
        failed: "Connection failed: ",
        noDb: "No available databases found"
      },
      analysis: {
        analyzing: "Analyzing query...",
        complete: "Analysis complete!"
      },
      visualization: {
        headers: {
          query: "Your SQL Query",
          results: "Query Analysis Results",
          plan: "Execution Plan",
          stats: "Table Statistics",
          indexes: "Existing Indexes",
          recommendations: "Recommendations"
        },
        table: {
          operation: "Operation",
          cost: "Cost",
          rows: "Rows",
          details: "Details",
          table: "Table",
          size: "Size",
          indexSize: "Index Size",
          indexName: "Index Name",
          columns: "Columns",
          type: "Type"
        },
        noData: {
          plan: "No execution plan available",
          stats: "No statistics available",
          indexes: "No indexes found",
          recommendations: "No recommendations available."
        }
      },
      errors: {
        analysis: "Error during analysis:",
        display: "Error displaying results:",
        emptyQuery: "Query cannot be empty",
        connection: {
          solutions: {
            title: "Possible solutions:",
            mysql: [
              "1. Make sure MySQL server is running",
              "2. Verify the port number (default is 3306)",
              "3. Check if MySQL is accepting connections from your IP",
              "4. Try the following command to check MySQL status:",
              "   sudo service mysql status   (Linux)",
              "   brew services list          (MacOS)"
            ],
            auth: [
              "1. Check if the username and password are correct",
              "2. Verify that the user has proper privileges",
              "3. Try using mysql_native_password authentication:",
              "   ALTER USER 'username'@'hostname' IDENTIFIED WITH mysql_native_password BY 'password';"
            ]
          }
        }
      },
      analyzer: {
        errors: {
            recommendations: "Error generating recommendations: "
        },
        recommendations: {
            // Existing translations
            tableScan: {
                message: (tableName) => `Full table scan detected on table ${tableName}`,
                suggestion: "Consider adding appropriate indexes",
                impact: "Full table scans can significantly impact query performance",
                implementation: {
                    review: "Review WHERE clause conditions",
                    addIndexes: "Add indexes on frequently filtered columns",
                    coveringIndexes: "Consider creating covering indexes"
                }
            },
            accessType: {
                message: (type) => `Suboptimal access type '${type}' detected`,
                suggestion: "Improve table access method",
                impact: "Current access method may result in poor performance",
                implementation: {
                    review: "Review query conditions and table structure",
                    indexCoverage: "Ensure proper index coverage",
                    restructure: "Consider restructuring the query"
                }
            },
            joinOptimization: {
                message: "Inefficient join operation detected",
                suggestion: "Optimize join operations",
                impact: "Current join strategy may cause performance issues",
                implementation: {
                    addIndexes: "Add indexes on join columns",
                    reviewConditions: "Review join conditions",
                    denormalization: "Consider selective denormalization"
                }
            },
            joinBuffer: {
                message: "Join buffer being used for table join",
                suggestion: "Optimize join buffer usage",
                impact: "Join buffer usage may indicate missing or inefficient indexes",
                implementation: {
                    addIndexes: "Add appropriate indexes on join columns",
                    reviewOrder: "Review join order",
                    bufferSize: "Adjust join buffer size if necessary"
                }
            },
            tempTable: {
                message: "Temporary table created for query execution",
                suggestion: "Minimize temporary table usage",
                impact: "Temporary tables can consume memory and slow query execution",
                implementation: {
                    review: "Review query structure",
                    addIndexes: "Add appropriate indexes",
                    restructure: "Consider query restructuring"
                }
            },
            fileSort: {
                message: "Filesort operation detected",
                suggestion: "Optimize sorting operations",
                impact: "Filesort operations can be resource-intensive",
                implementation: {
                    addIndexes: "Add indexes matching sort order",
                    bufferSize: "Adjust sort buffer size",
                    limitResults: "Consider limiting result set"
                }
            },
            unusedIndexes: {
                message: "Potential indexes not being used",
                suggestion: "Review index usage",
                impact: "Unused indexes add overhead without benefits",
                implementation: {
                    analyze: "Analyze index usage patterns",
                    review: "Review and remove unused indexes",
                    forceIndex: "Consider force index hint if needed"
                }
            },
            partialIndex: {
                message: "Partial index usage detected",
                suggestion: "Optimize index coverage",
                impact: "Partial index usage may not provide optimal performance",
                implementation: {
                    review: "Review index structure",
                    covering: "Consider creating covering indexes",
                    analyze: "Analyze query patterns"
                }
            },
            dependentSubquery: {
                message: "Dependent subquery detected",
                suggestion: "Optimize or eliminate dependent subquery",
                impact: "Dependent subqueries execute once for each outer row, potentially causing performance issues",
                implementation: {
                    join: "Consider replacing with JOIN",
                    rewrite: "Rewrite as uncorrelated subquery",
                    indexes: "Add indexes to support subquery execution"
                }
            },
            subquery: {
                message: "Uncorrelated subquery detected",
                suggestion: "Review and optimize subquery implementation",
                impact: "Subquery execution might not be using optimal execution plan",
                implementation: {
                    join: "Consider replacing with JOIN",
                    rewrite: "Rewrite using derived tables",
                    indexes: "Ensure proper indexing for subquery",
                    limit: "Consider adding LIMIT if applicable"
                }
            },
            groupBy: {
                message: "Inefficient GROUP BY operation detected",
                suggestion: "Optimize grouping operations",
                impact: "Unoptimized GROUP BY operations can create temporary tables and require filesorts",
                implementation: {
                    index: "Add indexes on grouped columns",
                    composite: "Consider composite indexes for group and filter columns",
                    review: "Review grouping criteria necessity"
                }
            },
            looseIndexScan: {
                message: "Potential for loose index scan optimization",
                suggestion: "Consider rewriting query to use loose index scan",
                impact: "Query could benefit from loose index scan optimization",
                implementation: {
                    rewrite: "Rewrite query to enable loose index scan",
                    index: "Ensure proper index structure",
                    min_max: "Use MIN/MAX optimizations where applicable"
                }
            },
            largeSort: {
                message: (rows) => `Large sort operation detected (${rows} rows)`,
                suggestion: "Optimize sorting for large result sets",
                impact: "Sorting large result sets can consume significant memory and CPU resources",
                implementation: {
                    indexSort: "Create indexes matching the sort columns",
                    limit: "Consider limiting the result set size",
                    buffer: "Adjust sort buffer size if necessary"
                }
            },
            largeTableScan: {
                message: (rows) => `Large table scan detected (${rows} rows)`,
                suggestion: "Optimize access pattern for large tables",
                impact: "Scanning large tables can severely impact performance",
                implementation: {
                    addIndexes: "Add appropriate indexes",
                    partition: "Consider table partitioning",
                    optimize: "Optimize table statistics"
                }
            },
            highIndexRatio: {
                message: "High index to data ratio detected",
                suggestion: "Review index strategy",
                impact: "Excessive indexes can impact write performance",
                implementation: {
                    review: "Review existing indexes",
                    remove: "Remove redundant indexes",
                    covering: "Optimize covering indexes"
                }
            },
            whereClause: {
                message: "Inefficient WHERE clause processing",
                suggestion: "Optimize WHERE clause execution",
                impact: "Inefficient WHERE clauses can slow query execution",
                implementation: {
                    review: "Review WHERE conditions",
                    addIndexes: "Add selective indexes",
                    restructure: "Consider query restructuring"
                }
            },
            distinct: {
                message: "Inefficient DISTINCT operation detected",
                suggestion: "Optimize DISTINCT processing",
                impact: "DISTINCT operations may create temporary tables",
                implementation: {
                    groupBy: "Consider using GROUP BY",
                    covering: "Use covering indexes",
                    review: "Review necessity of DISTINCT"
                }
            },
            partitioning: {
                message: "Suboptimal partition pruning detected",
                suggestion: "Optimize partition strategy",
                impact: "Poor partition pruning can impact performance",
                implementation: {
                    review: "Review partitioning scheme",
                    ensure: "Ensure partition key usage in queries",
                    consider: "Consider alternative partitioning strategies"
                }
            }
        }
      },
    },
    id: {
      title: "DB Query Analyzer",
      subtitle: "Analisis dan optimalkan query database Anda",
      dbSelection: {
        type: "Pilih tipe database:",
        host: "Masukkan host database:",
        port: "Masukkan port database:",
        username: "Masukkan username database:",
        password: "Masukkan password database:",
        database: "Pilih database:",
        query: "Masukkan query SQL Anda:"
      },
      connection: {
        testing: "Menguji koneksi database...",
        success: {
          mysql: "Berhasil terhubung ke server MySQL!",
          postgresql: "Berhasil terhubung ke server PostgreSQL!"
        },
        failed: "Koneksi gagal: ",
        noDb: "Tidak ada database yang tersedia"
      },
      analysis: {
        analyzing: "Menganalisis query...",
        complete: "Analisis selesai!"
      },
      visualization: {
        headers: {
          query: "Query SQL Anda",
          results: "Hasil Analisis Query",
          plan: "Rencana Eksekusi",
          stats: "Statistik Tabel",
          indexes: "Index Yang Ada",
          recommendations: "Rekomendasi"
        },
        table: {
          operation: "Operasi",
          cost: "Biaya",
          rows: "Baris",
          details: "Detail",
          table: "Tabel",
          size: "Ukuran",
          indexSize: "Ukuran Index",
          indexName: "Nama Index",
          columns: "Kolom",
          type: "Tipe"
        },
        noData: {
          plan: "Tidak ada rencana eksekusi tersedia",
          stats: "Tidak ada statistik tersedia",
          indexes: "Tidak ada index ditemukan",
          recommendations: "Tidak ada rekomendasi tersedia."
        }
      },
      errors: {
        analysis: "Error selama analisis:",
        display: "Error menampilkan hasil:",
        emptyQuery: "Query tidak boleh kosong",
        connection: {
          solutions: {
            title: "Solusi yang mungkin:",
            mysql: [
              "1. Pastikan server MySQL berjalan",
              "2. Verifikasi nomor port (default adalah 3306)",
              "3. Periksa apakah MySQL menerima koneksi dari IP Anda",
              "4. Coba perintah bFull table scan terdeteksi pada tabelerikut untuk memeriksa status MySQL:",
              "   sudo service mysql status   (Linux)",
              "   brew services list          (MacOS)"
            ],
            auth: [
              "1. Periksa apakah username dan password sudah benar",
              "2. Verifikasi bahwa pengguna memiliki hak akses yang sesuai",
              "3. Coba gunakan autentikasi mysql_native_password:",
              "   ALTER USER 'username'@'hostname' IDENTIFIED WITH mysql_native_password BY 'password';"
            ]
          }
        }
      },
      analyzer: {
        errors: {
            recommendations: "Error menghasilkan rekomendasi: "
        },
        recommendations: {
            tableScan: {
                message: (tableName) => `Full table scan terdeteksi pada tabel ${tableName}`,
                suggestion: "Pertimbangkan untuk menambahkan indeks yang sesuai",
                impact: "Full table scan dapat berdampak signifikan pada kinerja query",
                implementation: {
                    review: "Tinjau kondisi klausa WHERE",
                    addIndexes: "Tambahkan indeks pada kolom yang sering difilter",
                    coveringIndexes: "Pertimbangkan membuat covering indexes"
                }
            },
            accessType: {
                message: (type) => `Tipe akses suboptimal '${type}' terdeteksi`,
                suggestion: "Tingkatkan metode akses tabel",
                impact: "Metode akses saat ini dapat mengakibatkan kinerja buruk",
                implementation: {
                    review: "Tinjau kondisi query dan struktur tabel",
                    indexCoverage: "Pastikan cakupan indeks yang tepat",
                    restructure: "Pertimbangkan restrukturisasi query"
                }
            },
            joinOptimization: {
                message: "Operasi join tidak efisien terdeteksi",
                suggestion: "Optimalkan operasi join",
                impact: "Strategi join saat ini dapat menyebabkan masalah kinerja",
                implementation: {
                    addIndexes: "Tambahkan indeks pada kolom join",
                    reviewConditions: "Tinjau kondisi join",
                    denormalization: "Pertimbangkan denormalisasi selektif"
                }
            },
            joinBuffer: {
                message: "Buffer join digunakan untuk join tabel",
                suggestion: "Optimalkan penggunaan buffer join",
                impact: "Penggunaan buffer join dapat menunjukkan indeks yang hilang atau tidak efisien",
                implementation: {
                    addIndexes: "Tambahkan indeks yang sesuai pada kolom join",
                    reviewOrder: "Tinjau urutan join",
                    bufferSize: "Sesuaikan ukuran buffer join jika perlu"
                }
            },
            tempTable: {
                message: "Tabel temporary dibuat untuk eksekusi query",
                suggestion: "Minimalkan penggunaan tabel temporary",
                impact: "Tabel temporary dapat mengonsumsi memori dan memperlambat eksekusi query",
                implementation: {
                    review: "Tinjau struktur query",
                    addIndexes: "Tambahkan indeks yang sesuai",
                    restructure: "Pertimbangkan restrukturisasi query"
                }
            },
            fileSort: {
                message: "Operasi filesort terdeteksi",
                suggestion: "Optimalkan operasi pengurutan",
                impact: "Operasi filesort dapat mengonsumsi banyak sumber daya",
                implementation: {
                    addIndexes: "Tambahkan indeks sesuai urutan pengurutan",
                    bufferSize: "Sesuaikan ukuran buffer pengurutan",
                    limitResults: "Pertimbangkan pembatasan hasil"
                }
            },
            unusedIndexes: {
                message: "Indeks potensial tidak digunakan",
                suggestion: "Tinjau penggunaan indeks",
                impact: "Indeks yang tidak digunakan menambah beban tanpa manfaat",
                implementation: {
                    analyze: "Analisis pola penggunaan indeks",
                    review: "Tinjau dan hapus indeks yang tidak digunakan",
                    forceIndex: "Pertimbangkan penggunaan force index jika diperlukan"
                }
            },
            partialIndex: {
                message: "Penggunaan indeks parsial terdeteksi",
                suggestion: "Optimalkan cakupan indeks",
                impact: "Penggunaan indeks parsial mungkin tidak memberikan kinerja optimal",
                implementation: {
                    review: "Tinjau struktur indeks",
                    covering: "Pertimbangkan pembuatan covering indexes",
                    analyze: "Analisis pola query"
                }
            },
            largeSort: {
                message: (rows) => `Operasi pengurutan besar terdeteksi (${rows} baris)`,
                suggestion: "Optimalkan pengurutan untuk hasil yang besar",
                impact: "Mengurutkan hasil yang besar dapat mengonsumsi banyak memori dan CPU",
                implementation: {
                    indexSort: "Buat indeks yang sesuai dengan kolom pengurutan",
                    limit: "Pertimbangkan untuk membatasi ukuran hasil",
                    buffer: "Sesuaikan ukuran buffer pengurutan jika perlu"
                }
            },
            dependentSubquery: {
                message: "Subquery dependen terdeteksi",
                suggestion: "Optimalkan atau hilangkan subquery dependen",
                impact: "Subquery dependen dieksekusi sekali untuk setiap baris luar, berpotensi menyebabkan masalah kinerja",
                implementation: {
                    join: "Pertimbangkan mengganti dengan JOIN",
                    rewrite: "Tulis ulang sebagai subquery tidak berkorelasi",
                    indexes: "Tambahkan indeks untuk mendukung eksekusi subquery"
                }
            },
            subquery: {
                message: "Subquery tidak berkorelasi terdeteksi",
                suggestion: "Tinjau dan optimalkan implementasi subquery",
                impact: "Eksekusi subquery mungkin tidak menggunakan rencana eksekusi optimal",
                implementation: {
                    join: "Pertimbangkan mengganti dengan JOIN",
                    rewrite: "Tulis ulang menggunakan derived tables",
                    indexes: "Pastikan pengindeksan yang tepat untuk subquery",
                    limit: "Pertimbangkan menambahkan LIMIT jika memungkinkan"
                }
            },
            groupBy: {
                message: "Operasi GROUP BY tidak efisien terdeteksi",
                suggestion: "Optimalkan operasi pengelompokan",
                impact: "Operasi GROUP BY yang tidak optimal dapat membuat tabel temporary dan memerlukan filesort",
                implementation: {
                    index: "Tambahkan indeks pada kolom yang dikelompokkan",
                    composite: "Pertimbangkan indeks komposit untuk kolom group dan filter",
                    review: "Tinjau kebutuhan kriteria pengelompokan"
                }
            },
            looseIndexScan: {
                message: "Potensi untuk optimasi loose index scan",
                suggestion: "Pertimbangkan menulis ulang query untuk menggunakan loose index scan",
                impact: "Query bisa mendapat manfaat dari optimasi loose index scan",
                implementation: {
                    rewrite: "Tulis ulang query untuk mengaktifkan loose index scan",
                    index: "Pastikan struktur indeks yang tepat",
                    min_max: "Gunakan optimasi MIN/MAX jika memungkinkan"
                }
            },
            largeTableScan: {
                message: (rows) => `Pemindaian tabel besar terdeteksi (${rows} baris)`,
                suggestion: "Optimalkan pola akses untuk tabel besar",
                impact: "Memindai tabel besar dapat sangat mempengaruhi kinerja",
                implementation: {
                    addIndexes: "Tambahkan indeks yang sesuai",
                    partition: "Pertimbangkan partisi tabel",
                    optimize: "Optimalkan statistik tabel"
                }
            },
            highIndexRatio: {
                message: "Rasio indeks ke data yang tinggi terdeteksi",
                suggestion: "Tinjau strategi pengindeksan",
                impact: "Indeks berlebihan dapat mempengaruhi kinerja penulisan",
                implementation: {
                    review: "Tinjau indeks yang ada",
                    remove: "Hapus indeks yang redundan",
                    covering: "Optimalkan covering indexes"
                }
            },
            whereClause: {
                message: "Pemrosesan klausa WHERE tidak efisien",
                suggestion: "Optimalkan eksekusi klausa WHERE",
                impact: "Klausa WHERE yang tidak efisien dapat memperlambat eksekusi query",
                implementation: {
                    review: "Tinjau kondisi WHERE",
                    addIndexes: "Tambahkan indeks selektif",
                    restructure: "Pertimbangkan restrukturisasi query"
                }
            },
            distinct: {
                message: "Operasi DISTINCT tidak efisien terdeteksi",
                suggestion: "Optimalkan pemrosesan DISTINCT",
                impact: "Operasi DISTINCT dapat membuat tabel temporary",
                implementation: {
                    groupBy: "Pertimbangkan penggunaan GROUP BY",
                    covering: "Gunakan covering indexes",
                    review: "Tinjau kebutuhan DISTINCT"
                }
            },
            partitioning: {
                message: "Pemangkasan partisi suboptimal terdeteksi",
                suggestion: "Optimalkan strategi partisi",
                impact: "Pemangkasan partisi yang buruk dapat mempengaruhi kinerja",
                implementation: {
                    review: "Tinjau skema partisi",
                    ensure: "Pastikan penggunaan kunci partisi dalam query",
                    consider: "Pertimbangkan strategi partisi alternatif"
                }
            }
        }
      }
    }
};
  
// Language utilities
class I18n {
  constructor(defaultLang = 'en') {
      this.currentLang = defaultLang;
  }

  setLanguage(lang) {
      if (translations[lang]) {
          this.currentLang = lang;
      } else {
          throw new Error(`Language '${lang}' not supported`);
      }
  }

  t(key, params = {}) {
      const value = this.getNestedValue(translations[this.currentLang], key);
      if (typeof value === 'function') {
          return value(params);
      }
      return value || key;
  }

  getNestedValue(obj, path) {
      return path.split('.').reduce((p, c) => (p && p[c]) ? p[c] : null, obj);
  }
}

module.exports = { I18n };