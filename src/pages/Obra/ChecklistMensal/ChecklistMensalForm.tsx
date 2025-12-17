import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { checklistMensalService } from "../../../services/checklistMensalService";
import "./ChecklistMensalForm.css";

const ChecklistMensalForm = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    observacoes: "",
    aprovadorNome: "",
    aprovadorEmail: "",
  });

  // Obter meses para o select
  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // Obter anos (últimos 5 anos até o próximo)
  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Por favor, selecione apenas arquivos PDF.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setError("O arquivo PDF deve ter no máximo 10MB.");
        return;
      }
      setPdfFile(file);
      setError(null);
      // Criar preview do nome do arquivo
      setPdfPreview(file.name);
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setPdfPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId) return;

    // PDF é opcional por enquanto
    // if (!pdfFile) {
    //   setError("Por favor, anexe o arquivo PDF do checklist.");
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);

      await checklistMensalService.createChecklist(obraId, {
        mes: formData.mes,
        ano: formData.ano,
        observacoes: formData.observacoes,
        pdfFile: pdfFile || undefined,
        aprovadorNome: formData.aprovadorNome || undefined,
        aprovadorEmail: formData.aprovadorEmail || undefined,
      });

      navigate(`/obras/${obraId}/checklist-mensal`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao criar checklist. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checklist-form-container">
      <div className="checklist-form-header">
        <button
          className="btn-back"
          onClick={() => navigate(`/obras/${obraId}/checklist-mensal`)}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="checklist-form-header-content">
          <ClipboardCheck size={32} />
          <div>
            <h1>Criar Novo Checklist Mensal</h1>
            <p>Preencha os dados e anexe o documento PDF</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="checklist-form">
        {error && (
          <div className="checklist-form-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="checklist-form-section">
          <h2>Dados do Checklist</h2>
          <div className="checklist-form-grid">
            <div className="checklist-form-group">
              <label htmlFor="mes">
                Mês <span className="required">*</span>
              </label>
              <select
                id="mes"
                value={formData.mes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mes: parseInt(e.target.value),
                  }))
                }
                required
              >
                {meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="checklist-form-group">
              <label htmlFor="ano">
                Ano <span className="required">*</span>
              </label>
              <select
                id="ano"
                value={formData.ano}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ano: parseInt(e.target.value),
                  }))
                }
                required
              >
                {anos.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            <div className="checklist-form-group">
              <label htmlFor="aprovadorNome">Nome do Aprovador (opcional)</label>
              <input
                id="aprovadorNome"
                type="text"
                value={formData.aprovadorNome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, aprovadorNome: e.target.value }))
                }
                placeholder="Ex: João da Silva"
              />
              <small>Campo opcional para registro do aprovador</small>
            </div>

            <div className="checklist-form-group">
              <label htmlFor="aprovadorEmail">E-mail do Aprovador (opcional)</label>
              <input
                id="aprovadorEmail"
                type="email"
                value={formData.aprovadorEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, aprovadorEmail: e.target.value }))
                }
                placeholder="Ex: joao@email.com"
              />
              <small>Campo opcional para registro do e-mail do aprovador</small>
            </div>

            <div className="checklist-form-group checklist-form-group-full">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observacoes: e.target.value,
                  }))
                }
                placeholder="Adicione observações relevantes sobre este checklist..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="checklist-form-section">
          <h2>Upload de Arquivo PDF (Opcional)</h2>
          <div className="checklist-form-upload">
            {!pdfFile ? (
              <label htmlFor="pdf-upload" className="checklist-upload-area">
                <Upload size={48} />
                <div>
                  <strong>Clique para selecionar ou arraste o arquivo PDF</strong>
                  <p>Formato aceito: PDF (máximo 10MB)</p>
                </div>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            ) : (
              <div className="checklist-file-preview">
                <div className="checklist-file-info">
                  <FileText size={32} />
                  <div>
                    <strong>{pdfPreview}</strong>
                    <p>
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={handleRemoveFile}
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="checklist-form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate(`/obras/${obraId}/checklist-mensal`)}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spinner-rotate" />
                Criando...
              </>
            ) : (
              <>
                <ClipboardCheck size={20} />
                Criar Checklist
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChecklistMensalForm;




