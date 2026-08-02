using RestosVisites.Domain.Enums;

namespace RestosVisites.Domain.Entities;

/// <summary>
/// Un compte utilisateur de l'application. Le mot de passe n'est jamais stocké ni manipulé en
/// clair par le Domain : seuls le hash, le sel et le nombre d'itérations (déjà calculés par la
/// couche Application via un port de hachage) sont conservés ici. La politique de complexité du
/// mot de passe en clair (longueur minimale, majuscule, chiffre, caractère spécial) est une règle
/// d'inscription, validée en Application avant hachage, pas une règle du Domain.
/// </summary>
public sealed class Utilisateur
{
    public Guid Id { get; }
    public string Email { get; }
    public string NomAffiche { get; private set; }
    public string MotDePasseHash { get; }
    public string MotDePasseSel { get; }
    public int MotDePasseIterations { get; }
    public RoleUtilisateur Role { get; private set; }

    public Utilisateur(
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations,
        RoleUtilisateur role)
        : this(Guid.NewGuid(), email, nomAffiche, motDePasseHash, motDePasseSel, motDePasseIterations, role)
    {
    }

    public Utilisateur(
        Guid id,
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations,
        RoleUtilisateur role)
    {
        Valider(email, nomAffiche, motDePasseHash, motDePasseSel, motDePasseIterations);

        Id = id;
        Email = email.Trim().ToLowerInvariant();
        NomAffiche = nomAffiche.Trim();
        MotDePasseHash = motDePasseHash;
        MotDePasseSel = motDePasseSel;
        MotDePasseIterations = motDePasseIterations;
        Role = role;
    }

    /// <summary>Change le rôle de l'utilisateur (promotion/rétrogradation par un Admin).</summary>
    public void ChangerRole(RoleUtilisateur nouveauRole)
    {
        Role = nouveauRole;
    }

    private static void Valider(
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new ArgumentException("L'email doit être une adresse valide.", nameof(email));
        }

        if (string.IsNullOrWhiteSpace(nomAffiche))
        {
            throw new ArgumentException("Le nom affiché ne peut pas être vide.", nameof(nomAffiche));
        }

        if (string.IsNullOrWhiteSpace(motDePasseHash))
        {
            throw new ArgumentException("Le hash du mot de passe ne peut pas être vide.", nameof(motDePasseHash));
        }

        if (string.IsNullOrWhiteSpace(motDePasseSel))
        {
            throw new ArgumentException("Le sel du mot de passe ne peut pas être vide.", nameof(motDePasseSel));
        }

        if (motDePasseIterations <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(motDePasseIterations), motDePasseIterations, "Le nombre d'itérations doit être positif.");
        }
    }
}
