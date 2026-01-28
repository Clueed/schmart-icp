export type CompanyInput = {
	name: string;
	domain?: string;
};

export type CompanyInputArray = Array<CompanyInput & Record<string, unknown>>;
