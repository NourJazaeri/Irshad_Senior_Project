import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiUsers, FiMapPin } from "react-icons/fi";

export default function CompanyCard({ company }) {
  const navigate = useNavigate();
  const c = company;
  
  const handleCardClick = () => {
    navigate(`/owner/companies/${c._id}`);
  };

  return (
    <article 
      className="wo-card wo-card--enhanced wo-card--clickable" 
      onClick={handleCardClick}
    >
      <div className="wo-card__content">
        <div className="wo-card__header">
          {c.logoUrl && (
            <div className="wo-card__logo">
              <img 
                src={c.logoUrl.startsWith('http') ? c.logoUrl : `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${c.logoUrl}`}
                alt={`${c.name} logo`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="wo-card__title-section">
            <div className="wo-card__row">
              <div className="wo-company__name">{c.name}</div>
              <span className="wo-badge wo-badge--green">Active</span>
            </div>
            {c.description && (
              <p className="wo-card__description">
                {c.description.length > 100 
                  ? `${c.description.substring(0, 100)}...` 
                  : c.description}
              </p>
            )}
          </div>
        </div>

        <div className="wo-card__details">
          <div className="wo-card__info-row">
            <div className="wo-card__info-item">
              <div className="wo-info__icon-container">
                <FiBriefcase className="wo-info__icon" />
              </div>
              <span className="wo-info__label">Industry</span>
              <span className="wo-info__value">{c.industry}</span>
            </div>
            <div className="wo-card__info-item">
              <div className="wo-info__icon-container">
                <FiUsers className="wo-info__icon" />
              </div>
              <span className="wo-info__label">Size</span>
              <span className="wo-info__value">{c.size}</span>
            </div>
            <div className="wo-card__info-item">
              <div className="wo-info__icon-container">
                <FiMapPin className="wo-info__icon" />
              </div>
              <span className="wo-info__label">Branches</span>
              <span className="wo-info__value">
                {c.branches ? 
                  (typeof c.branches === 'string' ? 
                    c.branches.split(',').filter(b => b.trim()).length : 
                    (Array.isArray(c.branches) ? c.branches.length : 1)
                  ) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
